const mqtt = require('mqtt');
const { LinuxImpulseRunner } = require('edge-impulse-linux');
const path = require('path');
const DSPProcessor = require('./dsp_processor.cjs');

// Configuration
const MQTT_BROKER = 'mqtt://broker.hivemq.com:1883';
const MQTT_TOPIC_ADXL = 'iiot/sensors/adxl345';
const MQTT_TOPIC_MPU = 'iiot/sensors/mpu6050';
const MQTT_TOPIC_PUBLISH = 'iiot/motor/status';
const MODEL_PATH = path.join(__dirname, 'vibration_pm-linux-x86_64-v2.eim');

// Buffer settings - collect enough samples for spectral analysis
const BUFFER_SIZE = 270; // 270 samples for FFT window (27 seconds @ 10Hz)
let sensorBuffer = [];
let latestADXL = { ax: 0, ay: 0, az: 0 };
let latestMPU = { accel: { x: 0, y: 0, z: 0 }, gyro: { x: 0, y: 0, z: 0 } };
let isProcessing = false;
let runner;
let dspProcessor;

console.log('🚀 Edge Impulse Vibration Classifier v2');
console.log(`📊 Model: ${MODEL_PATH}`);
console.log(`📡 MQTT: ${MQTT_BROKER}`);

// Initialize Edge Impulse Runner and DSP Processor
async function initRunner() {
  try {
    runner = new LinuxImpulseRunner(MODEL_PATH);
    await runner.init();
    
    const model = runner.getModel();
    console.log(`✅ Model loaded: ${model.project.name}`);
    console.log(`   Labels: ${model.modelParameters.labels.join(', ')}`);
    console.log(`   Input features: ${model.modelParameters.input_features_count}`);
    console.log(`   Axis count: ${model.modelParameters.axis_count}`);
    console.log(`   Slice size: ${model.modelParameters.slice_size}`);
    console.log(`   Frequency: ${model.modelParameters.frequency}Hz`);
    console.log(`   Interval: ${model.modelParameters.interval_ms}ms`);
    
    // Initialize DSP processor
    dspProcessor = new DSPProcessor({
      sampleRate: model.modelParameters.frequency,
      frameLength: model.modelParameters.slice_size,
      frameLengthPower2: 256, // Next power of 2 after 270
      axisCount: model.modelParameters.axis_count,
      expectedFeatures: model.modelParameters.input_features_count
    });
    
    console.log(`✅ DSP Processor initialized`);
    console.log(`   Expected features per axis: ${dspProcessor.getExpectedFeatureCount() / model.modelParameters.axis_count}`);
    console.log(`   Total expected features: ${dspProcessor.getExpectedFeatureCount()}`);
    
    return true;
  } catch (err) {
    console.error('❌ Failed to initialize model:', err);
    return false;
  }
}

// MQTT Client
const mqttClient = mqtt.connect(MQTT_BROKER);

mqttClient.on('connect', () => {
  console.log('✅ Connected to MQTT broker');
  
  mqttClient.subscribe(MQTT_TOPIC_ADXL, (err) => {
    if (!err) console.log(`📥 Subscribed to ${MQTT_TOPIC_ADXL}`);
  });
  
  mqttClient.subscribe(MQTT_TOPIC_MPU, (err) => {
    if (!err) console.log(`📥 Subscribed to ${MQTT_TOPIC_MPU}`);
  });
});

mqttClient.on('message', async (topic, message) => {
  try {
    const data = JSON.parse(message.toString());
    
    // Update latest readings
    if (topic === MQTT_TOPIC_ADXL && data.ax !== undefined) {
      latestADXL = { ax: data.ax, ay: data.ay, az: data.az };
    } else if (topic === MQTT_TOPIC_MPU && data.accel !== undefined) {
      latestMPU = {
        accel: { x: data.accel.x, y: data.accel.y, z: data.accel.z },
        gyro: { x: data.gyro.x, y: data.gyro.y, z: data.gyro.z }
      };
    }
    
    // Collect combined 9-axis data
    sensorBuffer.push({
      timestamp: Date.now(),
      ax1: latestADXL.ax,
      ay1: latestADXL.ay,
      az1: latestADXL.az,
      ax2: latestMPU.accel.x,
      ay2: latestMPU.accel.y,
      az2: latestMPU.accel.z,
      gx: latestMPU.gyro.x,
      gy: latestMPU.gyro.y,
      gz: latestMPU.gyro.z
    });

    // Show progress every 50 samples
    if (sensorBuffer.length % 50 === 0 && sensorBuffer.length < BUFFER_SIZE) {
      console.log(`📊 Buffer: ${sensorBuffer.length}/${BUFFER_SIZE}`);
    }

    // Run classification when buffer is full
    if (sensorBuffer.length >= BUFFER_SIZE && !isProcessing) {
      await runClassification();
    }

    // Keep buffer from growing too large
    if (sensorBuffer.length > BUFFER_SIZE * 2) {
      sensorBuffer = sensorBuffer.slice(-BUFFER_SIZE);
    }
  } catch (err) {
    console.error('❌ Error parsing MQTT message:', err);
  }
});

async function runClassification() {
  if (!runner || !dspProcessor) {
    console.log('⏳ Waiting for initialization...');
    return;
  }

  isProcessing = true;
  
  try {
    // Get last BUFFER_SIZE samples
    const samples = sensorBuffer.slice(-BUFFER_SIZE);
    
    // Flatten to single array: [ax1, ay1, az1, ax2, ay2, az2, gx, gy, gz, ...]
    const rawValues = [];
    samples.forEach(s => {
      rawValues.push(s.ax1, s.ay1, s.az1, s.ax2, s.ay2, s.az2, s.gx, s.gy, s.gz);
    });

    console.log(`\n🔍 Running classification with ${samples.length} samples (${rawValues.length} raw values)...`);
    console.log(`⚙️  Extracting spectral features using DSP processor...`);
    
    // Extract spectral features using DSP processor
    const processedFeatures = dspProcessor.processSpectralFeatures(rawValues);
    console.log(`✓  Extracted ${processedFeatures.length} features`);
    
    // Run inference with processed features
    const result = await runner.classify(processedFeatures);
    
    if (result && result.result && result.result.classification) {
      const predictions = result.result.classification;
      const sorted = Object.entries(predictions).sort((a, b) => b[1] - a[1]);
      const topLabel = sorted[0][0];
      const topScore = sorted[0][1];
      
      console.log('✅ Classification Results:');
      sorted.forEach(([label, score]) => {
        const bar = '█'.repeat(Math.round(score * 20));
        console.log(`   ${label.padEnd(15)} ${(score * 100).toFixed(1)}% ${bar}`);
      });
      
      // Publish result to MQTT
      const status = {
        label: topLabel,
        confidence: topScore,
        timestamp: new Date().toISOString(),
        classifications: predictions
      };
      
      mqttClient.publish(MQTT_TOPIC_PUBLISH, JSON.stringify(status));
      console.log(`📤 Published: ${topLabel} (${(topScore * 100).toFixed(1)}% confidence)\n`);
      
      // Reset buffer after successful classification
      sensorBuffer = sensorBuffer.slice(-Math.floor(BUFFER_SIZE / 2));
    }
  } catch (err) {
    console.error('❌ Classification error:', err);
  } finally {
    isProcessing = false;
  }
}

mqttClient.on('error', (err) => {
  console.error('❌ MQTT Error:', err);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n👋 Shutting down...');
  mqttClient.end();
  if (runner) {
    await runner.stop();
  }
  process.exit(0);
});

// Initialize
(async () => {
  const initialized = await initRunner();
  if (!initialized) {
    console.error('❌ Failed to start classifier');
    process.exit(1);
  }
  console.log('✅ Classifier ready!\n');
})();
