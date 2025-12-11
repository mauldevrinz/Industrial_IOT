# Vibration Monitoring for Predictive Maintenance (PdM)

A modern, real-time vibration monitoring and predictive maintenance dashboard built with React. Integrates ESP32 sensors via MQTT for industrial motor/equipment health monitoring with Edge Impulse ML-based vibration classification.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Status](https://img.shields.io/badge/status-Active-brightgreen.svg)

## 🌟 Features

### 📊 Real-time Vibration Monitoring
- **Live Vibration Data**: Real-time accelerometer readings (X, Y, Z axes)
- **Frequency Analysis**: FFT processing for harmonic detection
- **Interactive Charts**: Real-time waveform and trend visualization with historical data
- **Data Export**: Export vibration data in CSV, JSON, or Excel formats
- **Persistent State**: Data persists across page navigation
- **Anomaly Detection**: Automatic motor malfunction detection

### 🤖 ML-Based Classification
- **Vibration Classification**: Real-time motor health status analysis
- **Edge Impulse Integration**: On-device ML inference
- **Condition States**: Normal vs Drop_Voltage detection
- **Automatic Labeling**: MQTT-based data annotation
- **Training Data Support**: Continuous data recording for model improvement

### 🎛️ Equipment Control & Monitoring
- **6 Industrial Actuators**: Motor, Pump, Fan, Heater, Valve, Compressor
- **MQTT-Based Control**: Real-time state synchronization
- **Visual Feedback**: Toggle switches with status indicators
- **Multi-Sensor Support**: Temperature, Pressure, Level, Vibration

### ⚙️ Industrial Integration
- **OpenPLC Support**: Direct integration with OpenPLC Editor
- **OTA Updates**: Upload compiled programs (.bin, .st, .ino) over-the-air
- **MQTT Protocol**: Industry-standard IoT communication
- **Base64 Encoding**: Secure file transmission

### ⚡ Configuration & Settings
- **MQTT Broker Setup**: Easy broker configuration
- **Real-time Alerts**: Browser notifications for critical states
- **Settings Persistence**: localStorage-based configuration
- **Import/Export**: Backup and restore configuration profiles

## ⚡ Quick Start (30 seconds)

### Start All Services
```bash
cd /path/to/vibration-monitoring
./start.sh
```

This automatically starts:
- ✅ **ESP32 Vibration Reader** (Python) - Reads accelerometer data via USB serial
- ✅ **Edge Impulse Classifier** (Node.js) - Real-time motor health classification
- ✅ **Backend API** (Express.js) on port 3001 - OTA & configuration endpoints
- ✅ **Frontend Dashboard** (Vite) on port 5173 - Vibration visualization & control

**Dashboard**: http://localhost:5173

### Stop All Services
```bash
./stop.sh
```

---

## 🚀 Installation & Setup

### Prerequisites
- **Node.js 16+** and npm
- **Python 3.7+** (for ESP32 MQTT reader & classifier)
- **MQTT Broker**: Pre-configured for broker.hivemq.com (public broker)
- **Optional**: ESP32 with MQTT support
- **Optional**: OpenPLC Editor
- **Optional**: mosquitto-clients for testing

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/mauldevrinz/Vibration_Monitoring_for_PdM.git
cd Vibration_Monitoring_for_PdM
```

2. **Install dependencies**
```bash
npm install
```

3. **Install Python dependencies** (if using ESP32)
```bash
pip3 install paho-mqtt pyserial
```

4. **Configure ESP32 Serial Port** (if applicable)
```bash
# Check available ports
ls /dev/ttyUSB*
# Update port in esp32_mqtt_reader.py if needed
```

5. **Start the application**

**Automated (Recommended):**
```bash
./start.sh
```

**Manual Start** (if needed):
```bash
# Terminal 1 - Frontend
npm run dev

# Terminal 2 - Backend
node server.cjs

# Terminal 3 - ESP32 Reader (if using ESP32)
python3 esp32_mqtt_reader.py /dev/ttyUSB0

# Terminal 4 - Edge Impulse Classifier
node edge_impulse_classifier.cjs
```

6. **View Real-time Logs**
```bash
# Frontend logs
tail -f frontend.log

# Backend logs
tail -f backend.log

# Classifier logs
tail -f classifier_output.log

# ESP32 Reader logs
tail -f esp32_mqtt_reader.log
```

## 📋 Quick Reference

| Service | Port | Command | Log |
|---------|------|---------|-----|
| Frontend (Vite) | 5173 | `npm run dev` | `frontend.log` |
| Backend API | 3001 | `node server.cjs` | `backend.log` |
| ESP32 Reader | USB | `python3 esp32_mqtt_reader.py` | `esp32_mqtt_reader.log` |
| Classifier | MQTT | `node edge_impulse_classifier.cjs` | `classifier_output.log` |

**Start Everything**: `./start.sh`  
**Stop Everything**: `./stop.sh`

## 📡 MQTT Configuration

### Services & Access Points
- **Dashboard Frontend**: http://localhost:5173
- **Backend API Health**: http://localhost:3001/api/health
- **MQTT Broker**: broker.hivemq.com (public HiveMQ broker)

### Current Setup
The dashboard is configured to use **broker.hivemq.com**:
- **Frontend**: `ws://broker.hivemq.com:8000/mqtt` (WebSocket)
- **Backend**: `mqtt://broker.hivemq.com:1883` (TCP)
- **Python Scripts**: `broker.hivemq.com:1883` (TCP)

### Change MQTT Broker

Edit `src/config/mqtt.config.js`:
```javascript
broker: {
  host: 'broker.hivemq.com',  // Your MQTT broker
  port: 8000,                 // WebSocket port
  protocol: 'ws',              // 'ws' or 'wss'
  path: '/mqtt',              // MQTT path
}
```

If using private broker with authentication:
```javascript
auth: {
  username: 'your_username',
  password: 'your_password',
}
```

### MQTT Topics

**Sensor Topics** (Subscribe):
- `iiot/sensor/temperature` - Temperature sensor (°C)
- `iiot/sensor/level/low` - Low level sensor (0 or 1)
- `iiot/sensor/level/high` - High level sensor (0 or 1)
- `iiot/sensor/pressure` - Pressure sensor (bar)
- `iiot/sensor/co2` - CO2 gas sensor (ppm)
- `iiot/sensor/vibration` - Vibration data for classification

**Actuator Topics** (Publish/Subscribe):
- `iiot/actuator/motor`
- `iiot/actuator/pump`
- `iiot/actuator/fan`
- `iiot/actuator/heater`
- `iiot/actuator/valve`
- `iiot/actuator/compressor`
- `iiot/actuator/status` (Combined status)

**Classifier Topics**:
- `iiot/classifier/motor/status` - Motor status (Normal/Drop_Voltage)

**Control Topics**:
- `iiot/control/ota/{device_id}` (OTA updates)

## 🧪 Testing MQTT

### Send Test Data (Continuous)

Run the included test script to send random sensor data:

```bash
./test-mqtt.sh
```

This will:
- Send random sensor data every 3 seconds
- Continuously loop until Ctrl+C
- Show transmission count and values

**Data ranges:**
- Temperature: 18-32°C
- Level: Discrete (L:0/1, H:0/1)
  - L:0 H:0 → Level 1 (Empty)
  - L:1 H:0 → Level 2 (Filling)
  - L:1 H:1 → Level 3 (Full)
  - L:0 H:1 → Error (Sensor malfunction)
- Pressure: 1.0-3.5 bar (displayed as PSI)
- CO2: 350-650 ppm

### Manual Testing

Send individual MQTT messages:

```bash
# Temperature
mosquitto_pub -h broker.hivemq.com -t iiot/sensor/temperature -m '{"value": 25.5, "unit": "celsius"}'

# Level (send both low and high sensors)
mosquitto_pub -h broker.hivemq.com -t iiot/sensor/level/low -m '{"value": 1}'
mosquitto_pub -h broker.hivemq.com -t iiot/sensor/level/high -m '{"value": 0}'

# Pressure
mosquitto_pub -h broker.hivemq.com -t iiot/sensor/pressure -m '{"value": 2.1, "unit": "bar"}'

# CO2
mosquitto_pub -h broker.hivemq.com -t iiot/sensor/co2 -m '{"value": 450, "unit": "ppm"}'
```

## 📊 Dashboard Overview

### 1. Vibration Monitoring (Overview Page)
- **Real-time Waveform**: Live vibration signal visualization (X, Y, Z axes)
- **Health Status Card**: Current motor condition (Normal/Drop_Voltage/Warning)
- **Trend Charts**: Historical vibration trends with pattern analysis
- **Equipment Status**: 6 industrial actuator states
- **System Runtime**: Persistent connection uptime counter

### 2. Data & Analytics (Data Page)
- **FFT Spectrum**: Frequency domain analysis for harmonic detection
- **Trend Charts**: Interactive area charts with multiple time ranges
- **Statistics**: Peak, RMS, Min, Max values from vibration data
- **Data Table**: Last 100 readings with timestamps and classifications
- **Predictive Alerts**: Early warning indicators based on ML model
- **Export**: Download data for offline analysis (CSV/JSON/Excel)

### 3. Configuration (Settings Page)
- **MQTT Broker Settings**: Connect to custom MQTT brokers
- **Equipment Profiles**: Different baseline configs for different motors
- **Model Selection**: Switch between Edge Impulse trained models
- **Notifications**: Configure alert thresholds and channels
- **OTA Updates**: Upload new firmware to ESP32 devices
- **Data Management**: Import/export configuration and training data

## 🎓 Using Vibration Monitoring for PdM

### Step 1: Collect Baseline Data
1. Connect ESP32 with accelerometer sensor
2. Ensure equipment is running in **normal condition**
3. Let the system collect 5-10 minutes of vibration data
4. Export data from Settings → Data Export

### Step 2: Label Training Data
```bash
# Download baseline data
# In Edge Impulse Studio:
# 1. Create new project
# 2. Import baseline vibration samples
# 3. Label as "Normal" class
```

### Step 3: Train ML Model
```bash
# In Edge Impulse Studio:
# 1. Create impulse with FFT block
# 2. Train neural network classifier
# 3. Test with validation data
# 4. Deploy as .eim model
```

### Step 4: Deploy Model
```bash
# Copy trained model to project
cp model.eim ./vibration_pm-linux-x86_64-v2.eim

# Restart classifier
pkill -f edge_impulse_classifier
node edge_impulse_classifier.cjs
```

### Step 5: Monitor & Alert
1. Open dashboard at http://localhost:5173
2. Watch for "Drop_Voltage" or anomaly classifications
3. Set alert thresholds in Settings
4. Receive notifications when conditions degrade

## 🔧 OTA Firmware Updates

### Upload New Firmware to ESP32

1. **Prepare Firmware**
   - Compile new firmware code (Arduino IDE or PlatformIO)
   - Generate `.bin`, `.st`, or `.ino` file

2. **Upload via Dashboard**
   - Go to **Settings** page → **OTA Upload** section
   - Click **"Choose File"** and select your firmware
   - Click **"Send OTA Update"**

3. **ESP32 Receives & Flashes**
   - Dashboard sends file via MQTT to `iiot/control/ota/{device_id}`
   - File is base64-encoded for safe transmission
   - ESP32 decodes and flashes new firmware
   - Device restarts automatically

### Supported File Types
- `.bin` - Compiled ESP32 binary
- `.ino` - Arduino sketch source
- `.st` - Structured Text (for PLC)

### File Size Limit
- Maximum: 10MB per file

## 📁 Project Structure

```
Vibration_Monitoring_for_PdM/
├── src/
│   ├── components/
│   │   └── dashboard/
│   │       ├── Overview.jsx              # Vibration monitoring & motor health
│   │       ├── Data.jsx                  # Analytics & FFT visualization
│   │       └── Settings.jsx              # Config, models, OTA upload
│   ├── hooks/
│   │   ├── useMQTT.js                   # MQTT connection (singleton)
│   │   └── useSensorData.js             # Vibration data management
│   ├── services/
│   │   └── mqttService.js               # MQTT service (global state)
│   └── config/
│       └── mqtt.config.js               # MQTT broker settings
├── public/
│   └── images/                           # Dashboard assets
├── server.cjs                            # Backend API (OTA, config)
├── esp32_mqtt_reader.py                  # Accelerometer data reader
├── edge_impulse_classifier.cjs           # ML vibration classifier
├── dsp_processor.cjs                     # FFT & signal processing
├── vibration_pm-linux-x86_64-v2.eim     # Trained Edge Impulse model
├── test-mqtt.sh                          # Test data generation script
├── start.sh                              # Launch all services
├── stop.sh                               # Shutdown services
├── package.json                          # Node.js dependencies
├── vite.config.js                        # Vite frontend config
├── tailwind.config.js                    # Tailwind CSS config
└── README.md                             # This documentation
```

## 📊 Key Components

### Frontend (React + Vite)
- **Real-time Vibration Dashboard**: Live waveform & FFT visualization
- **Interactive Charts**: Recharts for trend analysis and anomaly detection
- **MQTT Client**: MQTT.js for WebSocket broker connection
- **Global State**: Centralized vibration & equipment status management
- **Responsive Design**: Works on desktop and tablet displays

### Backend (Express.js)
- **REST API**: Endpoints for OTA firmware updates
- **Configuration Management**: Store & retrieve sensor settings
- **Health Check**: Endpoint for service monitoring
- **File Handling**: Secure file upload and transmission

### Python Services (esp32_mqtt_reader.py)
- **Serial Communication**: Reads accelerometer data from ESP32 via USB
- **MQTT Publisher**: Sends vibration data to broker in real-time
- **Data Buffering**: Collects samples for FFT processing
- **Auto-reconnect**: Handles connection failures gracefully

### Edge Impulse Classifier (edge_impulse_classifier.cjs)
- **ML Inference Engine**: Real-time motor health classification
- **FFT Processing**: Frequency domain analysis via dsp_processor
- **MQTT Integration**: Subscribes to vibration data, publishes predictions
- **Model Deployment**: Runs trained .eim model for anomaly detection
- **Low-latency**: Sub-100ms classification time

## ⏱️ Performance & Specifications

| Metric | Value |
|--------|-------|
| **Dashboard Update Rate** | ~100ms |
| **Vibration Sampling Rate** | 100 Hz (ESP32) |
| **MQTT Publish Interval** | 300ms |
| **Classifier Latency** | < 50ms |
| **FFT Resolution** | 64-256 samples |
| **Data Retention** | Last 10,000 samples (~100s) |
| **Alert Notification** | < 200ms |

## 🛠️ Troubleshooting

### Services Not Starting?
Check the logs:
```bash
tail -50 startup.log     # Overall startup log
tail -50 frontend.log    # Frontend issues
tail -50 backend.log     # Backend issues
tail -50 classifier_output.log  # Classifier issues
```

### ESP32 Not Connecting?
- Ensure ESP32 is connected via USB
- Check available serial ports:
  ```bash
  ls /dev/ttyUSB*
  ```
- Manually test the reader:
  ```bash
  python3 esp32_mqtt_reader.py /dev/ttyUSB0
  ```
- Check Python dependencies:
  ```bash
  pip3 install paho-mqtt pyserial
  ```

### MQTT Connection Issues

**Problem**: "MQTT Client Offline" or connection loop

**Solution**:
1. Check broker is accessible:
   ```bash
   nc -zv broker.hivemq.com 1883
   ping broker.hivemq.com
   ```
2. Verify WebSocket port is open (8000)
3. Check browser console for errors
4. Try refreshing browser (Ctrl+Shift+R)
5. Restart services:
   ```bash
   ./stop.sh && ./start.sh
   ```

**Problem**: "Not authorized" error

**Solution**:
- HiveMQ public broker doesn't require auth
- If using private broker, add credentials in `mqtt.config.js`
- Check credentials in `esp32_mqtt_reader.py` if using ESP32

### Data Not Showing

**Problem**: Charts empty or no data in Data page

**Solution**:
1. Ensure MQTT is connected (check Overview page status)
2. Run test script: `./test-mqtt.sh`
3. Check console logs for "📨 Message received"
4. Subscribe to topics and verify data:
   ```bash
   mosquitto_sub -h broker.hivemq.com -t 'iiot/sensors/#'
   ```
5. Wait for multiple data points (at least 3-5)

**Problem**: Classifier not processing vibration data

**Solution**:
1. Ensure Edge Impulse Classifier is running
2. Check `classifier_output.log` for errors
3. Verify vibration data is being published to `iiot/sensor/vibration`
4. Restart classifier: `pkill -f edge_impulse_classifier`

### Port Already in Use?
```bash
# Kill processes on specific ports
lsof -ti:5173 | xargs kill -9   # Frontend port
lsof -ti:3001 | xargs kill -9   # Backend port
```

### OTA Upload Issues

**Problem**: "MQTT client not connected" when uploading

**Solution**:
1. Check MQTT connection status in Overview
2. Ensure backend server is running: `node server.cjs`
3. Verify broker is accessible from backend

**Problem**: File upload rejected

**Solution**:
- Only `.bin`, `.st`, `.ino` files allowed
- Maximum file size: 10MB
- Check file extension matches content type

### Backend Server Issues

**Problem**: Backend won't start

**Solution**:
1. Install dependencies: `npm install`
2. Check port 3001 is not in use:
   ```bash
   lsof -i :3001
   ```
3. Kill existing process if needed:
   ```bash
   kill -9 <PID>
   ```

## 🔒 Security & Best Practices

### MQTT Security
- **Public Broker**: broker.hivemq.com is public, no authentication required
- **For Production**: Use private broker with TLS encryption and authentication
- **Topic Naming**: Use unique prefixes to prevent cross-project conflicts
- **Payload Encryption**: Consider encrypting sensitive vibration data

### OTA Firmware Security
- **File Validation**: Only `.bin`, `.st`, `.ino` files accepted
- **Size Limits**: 10MB maximum to prevent memory issues
- **Encoding**: Base64 encoding for safe MQTT transmission
- **Verification**: Checksum validation before flashing
- **Cleanup**: Temporary files deleted automatically

### Data Privacy
- **Local Storage**: Settings stored in browser localStorage only (no cloud sync)
- **No User Auth**: Dashboard has no authentication - use firewall/VPN
- **Model Security**: Edge Impulse model is binary/obfuscated (.eim format)

## 🐛 Known Limitations & Roadmap

### Current Limitations
1. **No User Authentication**: Dashboard accessible to anyone on network
2. **Public MQTT Broker**: Using public HiveMQ (not secure for production)
3. **No Database Persistence**: Historical data only in browser memory
4. **Single Device**: Designed for one ESP32/motor - multi-device pending
5. **No Mobile App**: Web-only dashboard (works on tablets)
6. **FFT Processing**: Limited to 256-sample windows due to ESP32 RAM

### 🚀 Future Enhancements
- [ ] User authentication & role-based access control
- [ ] Time-series database for long-term data storage
- [ ] Email/SMS alerts for critical vibration events
- [ ] Multi-device dashboard (multiple motors)
- [ ] Advanced ML models (anomaly detection, RUL prediction)
- [ ] Mobile app (iOS/Android with React Native)
- [ ] Docker containers for easy deployment
- [ ] Kubernetes integration for cloud deployment
- [ ] Historical trend analysis & reporting
- [ ] Integration with existing ERP/MES systems

## 📝 License

MIT License - see LICENSE file for details

## 👨‍💻 Author & Contributors

**Maulvin Nazir**
- GitHub: [@mauldevrinz](https://github.com/mauldevrinz)
- Project: [Vibration Monitoring for PdM](https://github.com/mauldevrinz/Vibration_Monitoring_for_PdM)

## 🙏 Acknowledgments & Technologies

**Frontend & UI**
- React 18 + Vite for fast development
- Tailwind CSS for responsive styling
- Recharts for beautiful data visualization
- Lucide React for consistent icons
- MQTT.js for WebSocket communication

**Backend & Processing**
- Express.js for REST API
- Node.js for cross-platform runtime
- Python for embedded systems integration
- paho-mqtt for MQTT client

**Machine Learning & DSP**
- Edge Impulse for ML model training & deployment
- FFT.js for fast Fourier transform processing
- TensorFlow.js for edge inference

**Infrastructure & Hosting**
- HiveMQ for public MQTT broker
- Git + GitHub for version control

---

## 📚 Additional Resources

- [Edge Impulse Documentation](https://docs.edgeimpulse.com)
- [MQTT Protocol Basics](https://mqtt.org/)
- [ESP32 Development Guide](https://docs.espressif.com/projects/esp-idf/en/latest/)
- [React Documentation](https://react.dev)
- [Predictive Maintenance Basics](https://en.wikipedia.org/wiki/Predictive_maintenance)

---

**Questions or Issues?** Open an issue on [GitHub](https://github.com/mauldevrinz/Vibration_Monitoring_for_PdM/issues) or check the Troubleshooting section above.
