#!/usr/bin/env node
/**
 * MQTT Subscribe Logger - Clean display for start.sh
 */

import mqtt from 'mqtt';

const client = mqtt.connect('ws://broker.hivemq.com:8000/mqtt', {
  protocolVersion: 4,
  clientId: 'subscribe_logger_' + Date.now(),
  rejectUnauthorized: false,
  reconnectPeriod: 5000
});

const topics = ['iiot/sensors/all'];

// Throttle output to once per second
let lastPrintTime = 0;
let dataCount = 0;

client.on('connect', () => {
  console.log('📡 MQTT Data Monitor Active\n');
  client.subscribe(topics[0], (err) => {
    if (!err) {
      console.log('════════════════════════════════════════════════════════════');
      console.log('📊 MQTT SENSOR DATA - Updates every 1 second');
      console.log('════════════════════════════════════════════════════════════\n');
    }
  });
});

client.on('message', (topic, message) => {
  try {
    const data = JSON.parse(message.toString());
    
    const now = Date.now();
    if (now - lastPrintTime >= 1000) {  // Print once per second
      dataCount++;
      const time = new Date().toTimeString().slice(0, 8);
      const adxl = data.adxl345 || {};
      const mpu = data.mpu6050 || {};
      const bmp = data.bmp280 || {};
      
      console.log(`[${time}] #${dataCount.toString().padStart(4, '0')} | ` +
        `ADXL(${adxl.ax?.toFixed(2)},${adxl.ay?.toFixed(2)},${adxl.az?.toFixed(2)}) | ` +
        `MPU(${mpu.accel?.x?.toFixed(2)},${mpu.accel?.y?.toFixed(2)},${mpu.accel?.z?.toFixed(2)}) | ` +
        `BMP(${bmp.temp?.toFixed(2)}°C,${bmp.pressure?.toFixed(2)}hPa)`
      );
      
      lastPrintTime = now;
    }
  } catch (err) {
    // Ignore parse errors silently
  }
});

client.on('error', (err) => {
  // Silent error handling
});

process.on('SIGINT', () => {
  console.log('\n════════════════════════════════════════════════════════════');
  console.log('✅ MQTT Monitor Stopped');
  console.log(`   Total data received: ${dataCount}`);
  console.log('════════════════════════════════════════════════════════════\n');
  client.end();
  process.exit(0);
});
