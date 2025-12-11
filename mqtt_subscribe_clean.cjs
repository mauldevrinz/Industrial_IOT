#!/usr/bin/env node

const mqtt = require('mqtt');

const MQTT_BROKER = process.env.MQTT_BROKER || 'broker.hivemq.com';
const MQTT_PORT = parseInt(process.env.MQTT_PORT || '1883');
const TOPIC_PREFIX = process.env.MQTT_TOPIC_PREFIX || 'iiot/sensors';

// Connect to MQTT broker
const client = mqtt.connect(`mqtt://${MQTT_BROKER}:${MQTT_PORT}`, {
  clientId: `iiot-logger-${Math.random().toString(16).substr(2, 8)}`,
  clean: true,
  reconnectPeriod: 5000,
  connectTimeout: 10000
});

// Timestamp formatter
const timestamp = () => {
  const now = new Date();
  return now.toTimeString().split(' ')[0]; // HH:MM:SS
};

// Last received data to avoid duplicates
let lastData = {};
let lastPrintTime = Date.now();
const PRINT_INTERVAL = 1000; // Print every 1 second

client.on('connect', () => {
  console.log(`\n📡 MQTT Logger Connected to ${MQTT_BROKER}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
  
  // Subscribe to all sensor topics
  client.subscribe(`${TOPIC_PREFIX}/adxl345`, (err) => {
    if (!err) console.log(`✓ Subscribed: ${TOPIC_PREFIX}/adxl345`);
  });
  
  client.subscribe(`${TOPIC_PREFIX}/mpu6050`, (err) => {
    if (!err) console.log(`✓ Subscribed: ${TOPIC_PREFIX}/mpu6050`);
  });
  
  client.subscribe(`${TOPIC_PREFIX}/bmp280`, (err) => {
    if (!err) console.log(`✓ Subscribed: ${TOPIC_PREFIX}/bmp280`);
  });
  
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
  console.log(`⏱️  Updates every 1 second | Press Ctrl+C to stop\n`);
});

client.on('message', (topic, message) => {
  try {
    const data = JSON.parse(message.toString());
    const now = Date.now();
    
    // Store data in buffer
    if (topic.includes('adxl345')) {
      lastData.adxl345 = data;
    } else if (topic.includes('mpu6050')) {
      lastData.mpu6050 = data;
    } else if (topic.includes('bmp280')) {
      lastData.bmp280 = data;
    }
    
    // Print only once per second
    if (now - lastPrintTime >= PRINT_INTERVAL && 
        lastData.adxl345 && lastData.mpu6050 && lastData.bmp280) {
      
      const adxl = lastData.adxl345;
      const mpu = lastData.mpu6050;
      const bmp = lastData.bmp280;
      
      console.log(`[${timestamp()}] 📊 Sensor Data:`);
      console.log(`  🔹 ADXL345: X=${adxl.ax?.toFixed(2)} Y=${adxl.ay?.toFixed(2)} Z=${adxl.az?.toFixed(2)} g`);
      console.log(`  🔹 MPU6050: Accel(${mpu.accel?.x?.toFixed(2)}, ${mpu.accel?.y?.toFixed(2)}, ${mpu.accel?.z?.toFixed(2)}) m/s² | Gyro(${mpu.gyro?.x?.toFixed(4)}, ${mpu.gyro?.y?.toFixed(4)}, ${mpu.gyro?.z?.toFixed(4)}) °/s`);
      console.log(`  🔹 BMP280: Temp=${bmp.temp?.toFixed(2)}°C | Pressure=${bmp.pressure?.toFixed(2)} hPa | Alt=${bmp.altitude?.toFixed(2)}m`);
      console.log('');
      
      lastPrintTime = now;
    }
  } catch (e) {
    // Ignore parse errors
  }
});

client.on('error', (err) => {
  console.error(`❌ MQTT Error: ${err.message}`);
});

client.on('offline', () => {
  console.log('⚠️  MQTT Offline - Reconnecting...');
});

client.on('reconnect', () => {
  console.log('🔄 Reconnecting to MQTT...');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n🛑 Shutting down MQTT logger...');
  client.end(false, () => {
    console.log('✓ Disconnected from MQTT broker');
    process.exit(0);
  });
});
