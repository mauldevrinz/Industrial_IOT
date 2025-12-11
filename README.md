# Industrial IoT Dashboard

A modern, real-time Industrial IoT monitoring and control dashboard built with React, integrated with ESP32 microcontrollers via MQTT protocol. Features real-time sensor monitoring, actuator control, OpenPLC integration, and vibration analysis with Edge Impulse.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## 🌟 Features

### Real-time Monitoring
- **Live Sensor Data**: Temperature, Level (3-level discrete), Pressure, CO2 Gas
- **Dual-Sensor Level System**: Low & High sensors for accurate tank monitoring
- **Interactive Charts**: Real-time trend visualization with historical data
- **Data Export**: Export to CSV, JSON, or Excel formats
- **Global State**: Data persists across page navigation
- **Error Detection**: Automatic sensor malfunction detection

### Actuator Control
- **6 Controllable Actuators**: Motor, Pump, Fan, Heater, Valve, Compressor
- **MQTT-Based Control**: Real-time state synchronization
- **Visual Feedback**: Toggle switches with status indicators
- **State Persistence**: Actuator states saved globally

### OpenPLC Integration
- **One-Click Launcher**: Open OpenPLC Editor directly from dashboard
- **OTA Updates**: Upload compiled programs (.bin, .st, .ino) to PLC
- **File Picker**: Easy file selection with validation
- **MQTT Transmission**: Base64-encoded OTA delivery

### Settings Management
- **MQTT Configuration**: Easy broker setup
- **Browser Notifications**: Real-time alerts
- **Settings Persistence**: localStorage-based
- **Import/Export**: Backup and restore settings

### Edge Impulse Integration
- **Vibration Classification**: Real-time motor status analysis
- **ML-Based Detection**: Identifies Normal vs Drop_Voltage states
- **MQTT Data Processing**: Automatic classification on sensor inputs

## ⚡ Quick Start (30 seconds)

### Start All Services
```bash
cd /home/maulvin/Documents/IIOT
./start.sh
```

This automatically starts:
- ✅ **ESP32 MQTT Reader** (Python) - Reads sensor data from USB serial
- ✅ **Edge Impulse Classifier** (Node.js) - Analyzes vibration data
- ✅ **Backend API** (Express.js) on port 3001
- ✅ **Frontend Dashboard** (Vite) on port 5173

**Access**: http://localhost:5173

### Stop All Services
```bash
./stop.sh
```

---

## 🚀 Detailed Setup

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
git clone https://github.com/mauldevrinz/Industrial_IOT.git
cd Industrial_IOT
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

## 📊 Dashboard Pages

### 1. Overview
- **Sensor Cards**: Real-time values with trends
  - Temperature (°C)
  - Level (Discrete 3-level system)
    - Level 1: Empty (L:0 H:0)
    - Level 2: Filling (L:1 H:0)
    - Level 3: Full (L:1 H:1)
    - ERROR: Sensor malfunction (L:0 H:1)
  - Pressure (PSI, auto-converted from bar)
  - CO2 Gas (ppm)
- **System Runtime**: Persistent connection timer
- **Actuator Control**: 6 actuators with toggle switches

### 2. Data
- **Trend Charts**: Interactive area charts with tooltips
- **Statistics**: Max, Min, Average values
- **Data Table**: Last 10 readings with timestamps
- **Sensor Selection**: Switch between different sensors
- **Export**: Download data in CSV/JSON/Excel

### 3. Settings
- **MQTT Configuration**: Broker settings
- **OpenPLC Launcher**: Open editor directly
- **OTA Upload**: Upload programs to ESP32
- **Browser Notifications**: Enable/disable alerts
- **Settings Import/Export**: Backup configuration

## 🔧 OTA Upload Guide

### Upload Ladder Diagram to ESP32

1. **Compile in OpenPLC Editor**
   - Write your ladder logic
   - Compile to generate `.bin` file
   - File will be in build folder

2. **Upload via Dashboard**
   - Go to **Settings** page
   - Click **"Choose File"** under OTA Upload
   - Select compiled `.bin`, `.st`, or `.ino` file
   - Click **"Send OTA Update"**

3. **ESP32 Receives Update**
   - Dashboard sends file via MQTT
   - ESP32 subscribes to `iiot/control/ota/{device_id}`
   - File is base64-encoded for transmission
   - ESP32 decodes and flashes the program

### Supported File Types
- `.bin` - Compiled binary
- `.st` - Structured Text
- `.ino` - Arduino sketch

### File Size Limit
- Maximum: 10MB per file

## 📁 Project Structure

```
Industrial_IOT/
├── src/
│   ├── components/
│   │   └── dashboard/
│   │       ├── Overview.jsx      # Main dashboard with sensors & actuators
│   │       ├── Data.jsx          # Charts and data visualization
│   │       └── Settings.jsx      # Configuration and OTA upload
│   ├── hooks/
│   │   ├── useMQTT.js           # MQTT connection hook (singleton)
│   │   └── useSensorData.js     # Sensor data management
│   ├── services/
│   │   └── mqttService.js       # MQTT service (global state)
│   └── config/
│       └── mqtt.config.js       # MQTT configuration
├── server.cjs                        # Backend server (OTA, OpenPLC)
├── esp32_mqtt_reader.py              # ESP32 USB serial reader
├── edge_impulse_classifier.cjs       # Vibration classifier (ML)
├── dsp_processor.cjs                 # Signal processing for ML
├── test-mqtt.sh                      # Continuous MQTT test script
├── start.sh                          # Start all services
├── stop.sh                           # Stop all services
├── package.json                      # Node.js dependencies
├── vite.config.js                    # Vite configuration
└── README.md                         # This file
```

## 📊 Key Components

### Frontend (React + Vite)
- **Real-time Dashboard**: Live sensor visualization
- **Interactive Charts**: Recharts for trend analysis
- **MQTT Client**: MQTT.js for browser connection
- **Global State**: Centralized sensor/actuator data management

### Backend (Express.js)
- **API Server**: REST endpoints for OTA & configuration
- **OpenPLC Integration**: Launch and manage OpenPLC Editor
- **OTA Updates**: Deliver firmware updates via MQTT

### Python Services
- **ESP32 Reader**: Reads sensor data from USB serial port
- **MQTT Publisher**: Sends data to broker in real-time

### Edge Impulse Classifier (Node.js)
- **ML Inference**: Real-time vibration analysis
- **Motor Status**: Detects Normal vs Drop_Voltage conditions
- **MQTT Integration**: Publishes classification results

## ⏱️ Performance Notes
- Frontend updates: ~100ms
- ESP32 sensor publishing: 300ms
- MQTT connection timeout: 45 seconds
- Classifier processing: Real-time (< 50ms)

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

## 🔒 Security Notes

### MQTT Security
- **Public Broker**: broker.hivemq.com is public, no authentication
- **For Production**: Use private broker with TLS and authentication
- **Topics**: Use unique prefixes to avoid conflicts

### OTA Security
- **Validation**: File types are validated (.bin, .st, .ino)
- **Size Limit**: 10MB maximum
- **Encoding**: Base64 for safe MQTT transmission
- **Cleanup**: Temporary files deleted after 5 seconds

## 🐛 Known Limitations

1. **Public Broker**: Using public MQTT broker (not secure for production)
2. **No Authentication**: Dashboard doesn't have user authentication
3. **Local Storage**: Settings stored in browser localStorage only
4. **No Database**: Historical data not persisted to database
5. **ESP32 Required**: Actuator control requires ESP32 with MQTT client
6. **Level Sensors**: Assumes correct physical sensor placement (low below high)

## 🚀 Future Enhancements

- [ ] User authentication and authorization
- [ ] Database integration for historical data
- [ ] Email/SMS alerts for critical values
- [ ] Multi-device support (multiple ESP32s)
- [ ] Advanced analytics and reporting
- [ ] Mobile app (React Native)
- [ ] Predictive maintenance with ML
- [ ] Docker containerization

## 📝 License

MIT License - see LICENSE file for details

## 👨‍💻 Author

**Maulvin Nazir**
- GitHub: [@mauldevrinz](https://github.com/mauldevrinz)

## 🙏 Acknowledgments

- React + Vite for fast development
- MQTT.js for MQTT client
- Recharts for beautiful charts
- Lucide React for icons
- HiveMQ for public MQTT broker
- OpenPLC for industrial automation

---

**Need Help?** Open an issue on GitHub or check the troubleshooting section above.
