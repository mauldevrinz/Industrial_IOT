const { spawn } = require('child_process');
const mqtt = require('mqtt');
const fs = require('fs');
const path = require('path');

// MQTT Configuration
const MQTT_BROKER = 'mqtt://broker.hivemq.com:1883';
const MQTT_TOPIC_ADXL = 'iiot/sensors/adxl345';
const MQTT_TOPIC_MPU = 'iiot/sensors/mpu6050';
const MQTT_TOPIC_PUBLISH = 'iiot/motor/status';

// Edge Impulse model path
const MODEL_PATH = path.join(__dirname, 'vibration_pm-linux-x86_64-v2.eim');

// Buffer to collect sensor data for vibration analysis
let sensorBuffer = [];
const BUFFER_SIZE = 135; // Reduced to match training data size (was 270)
const CLASSIFICATION_INTERVAL = 1000; // Klasifikasi setiap 1 detik

// Latest sensor readings (untuk sinkronisasi 9 axis)
let latestADXL = { ax: 0, ay: 0, az: 0 };
let latestMPU = { accel: { x: 0, y: 0, z: 0 }, gyro: { x: 0, y: 0, z: 0 } };

// MQTT Client
let mqttClient;
let modelProcess;
let isProcessing = false;

console.log('🚀 Edge Impulse Classifier Starting...');
console.log(`📊 Model: ${MODEL_PATH}`);
console.log(`📡 MQTT Broker: ${MQTT_BROKER}`);
console.log(`📥 Subscribe: ${MQTT_TOPIC_ADXL}, ${MQTT_TOPIC_MPU}`);
console.log(`📤 Publish: ${MQTT_TOPIC_PUBLISH}`);

// Initialize MQTT Connection
function initMQTT() {
  mqttClient = mqtt.connect(MQTT_BROKER, {
    clientId: `edge_impulse_classifier_${Math.random().toString(16).slice(2, 8)}`,
    clean: true,
    reconnectPeriod: 1000,
  });

  mqttClient.on('connect', () => {
    console.log('✅ Connected to MQTT broker');
    
    mqttClient.subscribe(MQTT_TOPIC_ADXL, (err) => {
      if (!err) console.log(`✅ Subscribed to ${MQTT_TOPIC_ADXL}`);
    });
    
    mqttClient.subscribe(MQTT_TOPIC_MPU, (err) => {
      if (!err) console.log(`✅ Subscribed to ${MQTT_TOPIC_MPU}`);
    });
  });

  mqttClient.on('message', (topic, message) => {
    try {
      const data = JSON.parse(message.toString());
      
      // Update latest readings based on topic
      if (topic === MQTT_TOPIC_ADXL && data.ax !== undefined) {
        latestADXL = { ax: data.ax, ay: data.ay, az: data.az };
        console.log(`📊 ADXL data: ax=${data.ax.toFixed(2)}, ay=${data.ay.toFixed(2)}, az=${data.az.toFixed(2)} | Buffer: ${sensorBuffer.length}/${BUFFER_SIZE}`);
      } else if (topic === MQTT_TOPIC_MPU && data.accel !== undefined) {
        latestMPU = {
          accel: { x: data.accel.x, y: data.accel.y, z: data.accel.z },
          gyro: { x: data.gyro.x, y: data.gyro.y, z: data.gyro.z }
        };
        console.log(`📊 MPU data received | Buffer: ${sensorBuffer.length}/${BUFFER_SIZE}`);
      }
      
      // Collect combined sensor data (9 axes)
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

      // When buffer is full, run classification
      if (sensorBuffer.length >= BUFFER_SIZE && !isProcessing) {
        runClassification();
      }

      // Keep buffer from growing too large
      if (sensorBuffer.length > BUFFER_SIZE * 2) {
        sensorBuffer = sensorBuffer.slice(-BUFFER_SIZE);
      }
    } catch (err) {
      console.error('❌ Error parsing MQTT message:', err);
    }
  });

  mqttClient.on('error', (err) => {
    console.error('❌ MQTT Error:', err);
  });

  mqttClient.on('reconnect', () => {
    console.log('🔄 Reconnecting to MQTT broker...');
  });
}

// Run Edge Impulse Classification
function runClassification() {
  if (isProcessing) return;
  
  isProcessing = true;
  
  // Prepare data for model (take last BUFFER_SIZE samples)
  const samples = sensorBuffer.slice(-BUFFER_SIZE);
  
  // Create JSON input for Edge Impulse runner
  const inputData = {
    id: Date.now(),
    values: []
  };
  
  // Flatten 9-axis sensor data: [ax1, ay1, az1, ax2, ay2, az2, gx, gy, gz, ...]
  samples.forEach(sample => {
    inputData.values.push(
      sample.ax1, sample.ay1, sample.az1,
      sample.ax2, sample.ay2, sample.az2,
      sample.gx, sample.gy, sample.gz
    );
  });

  const jsonInput = JSON.stringify(inputData);
  
  console.log(`\n🔍 Running classification with ${samples.length} samples...`);

  // Spawn Edge Impulse model process with stdin parameter
  const modelProcess = spawn(MODEL_PATH, ['stdin'], {
    stdio: ['pipe', 'pipe', 'pipe']
  });

  let stdoutData = '';
  let stderrData = '';

  // Send input data to model
  modelProcess.stdin.write(jsonInput + '\n');
  modelProcess.stdin.end();

  modelProcess.stdout.on('data', (data) => {
    stdoutData += data.toString();
  });

  modelProcess.stderr.on('data', (data) => {
    stderrData += data.toString();
  });

  modelProcess.on('close', (code) => {
    try {
      if (code !== 0) {
        console.error('❌ Model process exited with code:', code);
        console.error('stderr:', stderrData);
        isProcessing = false;
        return;
      }

      // Parse model output
      const lines = stdoutData.split('\n');
      let results = null;

      for (const line of lines) {
        try {
          const parsed = JSON.parse(line);
          if (parsed.result) {
            results = parsed.result;
            break;
          }
        } catch (e) {
          // Not JSON, skip
        }
      }

      if (results && results.classification) {
        const classification = results.classification;
        
        // Find highest probability label
        let maxLabel = '';
        let maxProb = 0;
        
        for (const [label, prob] of Object.entries(classification)) {
          if (prob > maxProb) {
            maxProb = prob;
            maxLabel = label;
          }
        }

        console.log('📊 Classification Results:');
        console.log(`   Label: ${maxLabel}`);
        console.log(`   Confidence: ${(maxProb * 100).toFixed(2)}%`);
        console.log(`   All scores:`, classification);

        // Publish result to MQTT
        const motorStatus = {
          timestamp: Date.now(),
          label: maxLabel,
          confidence: maxProb,
          status: maxLabel === 'normal' ? 'Normal' : 'Drop Voltage',
          voltage_stable: maxLabel === 'normal',
          all_scores: classification
        };

        mqttClient.publish(MQTT_TOPIC_PUBLISH, JSON.stringify(motorStatus), { qos: 1 });
        console.log(`✅ Published motor status: ${motorStatus.status}`);
      } else {
        console.error('❌ No classification results found in output');
        console.log('Raw output:', stdoutData);
      }
    } catch (err) {
      console.error('❌ Error processing model output:', err);
    } finally {
      isProcessing = false;
    }
  });

  modelProcess.on('error', (err) => {
    console.error('❌ Failed to start model process:', err);
    isProcessing = false;
  });
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down...');
  if (mqttClient) {
    mqttClient.end();
  }
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down...');
  if (mqttClient) {
    mqttClient.end();
  }
  process.exit(0);
});

// Start
initMQTT();
