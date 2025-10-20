const express = require('express');
const { exec } = require('child_process');
const path = require('path');
const cors = require('cors');
const multer = require('multer');
const mqtt = require('mqtt');
const fs = require('fs');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Keep original filename with timestamp
    const timestamp = Date.now();
    const originalName = file.originalname;
    cb(null, `${timestamp}_${originalName}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only .bin, .st, .ino files
    const allowedExtensions = ['.bin', '.st', '.ino'];
    const ext = path.extname(file.originalname).toLowerCase();

    if (allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only .bin, .st, and .ino files are allowed.'));
    }
  }
});

// MQTT Client
let mqttClient = null;

function connectMQTT() {
  if (mqttClient && mqttClient.connected) {
    return mqttClient;
  }

  // Use HiveMQ public broker
  const brokerUrl = 'mqtt://broker.hivemq.com:1883';

  mqttClient = mqtt.connect(brokerUrl, {
    clientId: 'iiot_backend_' + Math.random().toString(16).substring(2, 10),
    clean: true,
    reconnectPeriod: 10000, // Increased to avoid spam reconnect
    keepalive: 60,
    protocolVersion: 4, // MQTT v3.1.1
  });

  mqttClient.on('connect', () => {
    console.log('✅ Backend connected to MQTT broker (broker.hivemq.com)');
  });

  mqttClient.on('error', (err) => {
    console.error('❌ MQTT connection error:', err.message);
  });

  return mqttClient;
}

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
app.post('/api/send-ota', upload.single('programFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const { targetDevice } = req.body;
    const filePath = req.file.path;
    const fileName = req.file.originalname;
    const fileSize = req.file.size;

    console.log(`📦 Received file: ${fileName} (${(fileSize / 1024).toFixed(2)} KB)`);
    console.log(`📍 File saved to: ${filePath}`);
    console.log(`🎯 Target device: ${targetDevice || 'ESP32-001'}`);

    // Connect to MQTT
    const client = connectMQTT();

    // Wait for connection if not connected
    if (!client.connected) {
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('MQTT connection timeout'));
        }, 5000);

        client.once('connect', () => {
          clearTimeout(timeout);
          resolve();
        });

        if (client.connected) {
          clearTimeout(timeout);
          resolve();
        }
      });
    }

    // Read file content
    const fileContent = fs.readFileSync(filePath);
    const fileBase64 = fileContent.toString('base64');

    // Prepare OTA message
    const otaMessage = {
      fileName: fileName,
      fileSize: fileSize,
      fileType: path.extname(fileName),
      timestamp: new Date().toISOString(),
      data: fileBase64
    };

    // Publish to MQTT topic
    const topic = `iiot/control/ota/${targetDevice || 'ESP32-001'}`;

    client.publish(topic, JSON.stringify(otaMessage), { qos: 1 }, (err) => {
      if (err) {
        console.error('❌ MQTT publish error:', err);
        return res.status(500).json({
          success: false,
          message: 'Failed to publish OTA update: ' + err.message
        });
      }

      console.log(`✅ OTA update published to topic: ${topic}`);

      // Clean up uploaded file after successful transmission
      setTimeout(() => {
        fs.unlink(filePath, (err) => {
          if (err) console.error('Error deleting temp file:', err);
          else console.log('🗑️  Temp file deleted:', filePath);
        });
      }, 5000);

      res.json({
        success: true,
        message: 'OTA update sent successfully',
        fileName: fileName,
        fileSize: fileSize,
        topic: topic
      });
    });

  } catch (error) {
    console.error('❌ Error in OTA upload:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
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
  console.log(`📡 MQTT integration enabled`);
  console.log(`\n Available endpoints:`);
  console.log(`   POST /api/open-plc-editor - Open OpenPLC Editor`);
  console.log(`   POST /api/send-ota - Send OTA update (with file upload)`);
  console.log(`   POST /api/update-mqtt-config - Update MQTT config`);
  console.log(`   GET  /api/health - Health check\n`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  if (mqttClient) mqttClient.end();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\nSIGINT received, shutting down gracefully...');
  if (mqttClient) mqttClient.end();
  process.exit(0);
});
