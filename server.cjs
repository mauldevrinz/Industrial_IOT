const express = require('express');
const { exec } = require('child_process');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Path to OpenPLC Editor
const OPENPLC_PATH = '/home/maulvin/Documents/OpenPLC_Editor';

// API endpoint to open OpenPLC Editor
app.post('/api/open-plc-editor', (req, res) => {
  console.log('Opening OpenPLC Editor...');

  const command = `cd ${OPENPLC_PATH} && ./openplc_editor.sh`;

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error('Error opening OpenPLC Editor:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to open OpenPLC Editor',
        error: error.message
      });
    }

    console.log('OpenPLC Editor opened successfully');
    res.json({
      success: true,
      message: 'OpenPLC Editor opened successfully',
      stdout,
      stderr
    });
  });
});

// API endpoint to send OTA update
app.post('/api/send-ota', (req, res) => {
  const { programFile, targetDevice } = req.body;

  console.log('Sending OTA update...');
  console.log('Program file:', programFile);
  console.log('Target device:', targetDevice);

  // Here you would implement the actual OTA logic:
  // 1. Read the compiled program file
  // 2. Convert to base64 or chunks
  // 3. Publish to MQTT topic

  // For now, we'll simulate the process
  setTimeout(() => {
    res.json({
      success: true,
      message: 'OTA update sent successfully',
      programFile,
      targetDevice
    });
  }, 1000);
});

// API endpoint to update MQTT config
app.post('/api/update-mqtt-config', (req, res) => {
  const mqttSettings = req.body;

  console.log('Updating MQTT configuration...');
  console.log('New settings:', mqttSettings);

  // Here you would update the mqtt.config.js file
  // For now, we'll just log and return success
  // In production, you might want to write to a config file

  res.json({
    success: true,
    message: 'MQTT configuration updated. Please restart the application.',
    settings: mqttSettings
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Backend server running on http://localhost:${PORT}`);
  console.log(`📁 OpenPLC Editor path: ${OPENPLC_PATH}`);
  console.log(`\n Available endpoints:`);
  console.log(`   POST /api/open-plc-editor - Open OpenPLC Editor`);
  console.log(`   POST /api/send-ota - Send OTA update`);
  console.log(`   GET  /api/health - Health check\n`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\nSIGINT received, shutting down gracefully...');
  process.exit(0);
});
