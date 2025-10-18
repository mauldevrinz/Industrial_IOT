# Industrial IoT Dashboard

A modern, real-time Industrial IoT monitoring and control dashboard built with React, integrated with ESP32 microcontrollers via MQTT protocol.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## 🌟 Features

### Real-time Monitoring
- Live sensor data visualization (Temperature, Humidity, Pressure, CO2)
- Interactive charts and trend analysis
- Historical data export (CSV, JSON, XML)
- Real-time actuator control

### Actuator Control
- 6 controllable actuators (Motor, Pump, Fan, Heater, Valve, Compressor)
- MQTT-based state persistence
- Real-time status feedback
- Toggle switches with visual indicators

### Predictive Maintenance (RAM Calculator)
- **Reliability** metrics calculation
- **Availability** monitoring
- **Maintainability** (MTTR) analysis
- Automated maintenance recommendations

### OpenPLC Integration
- One-click OpenPLC Editor launcher
- Over-The-Air (OTA) program updates
- Direct integration with ESP32 devices

### Settings Management
- MQTT broker configuration
- Browser notifications
- Settings import/export
- Persistent localStorage

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and npm
- MQTT Broker (Mosquitto, HiveMQ, or EMQX)
- Optional: ESP32 microcontroller with MQTT support
- Optional: OpenPLC Editor

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

3. **Configure MQTT settings**

Edit `src/config/mqtt.config.js`:
```javascript
broker: {
  host: 'your-mqtt-broker.com',  // Change this
  port: 8883,
  protocol: 'ws',  // or 'wss' for secure
}
```

4. **Start the application**

**Option 1: One Command (Recommended)**
```bash
./start.sh
```

**Option 2: Using npm**
```bash
npm run dev:all
```

**Option 3: Separate Terminals**
```bash
# Terminal 1 - Frontend
npm run dev

# Terminal 2 - Backend
npm run server
```

5. **Access the dashboard**
- **Frontend**: http://localhost:5174
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/api/health

## 📊 Technology Stack

### Frontend
- React 19.1.1
- Vite 7.1.7
- Tailwind CSS 3.4.17
- Recharts 3.3.0
- MQTT.js 5.14.1
- Lucide React (icons)

### Backend
- Express 5.1.0
- Node.js
- MQTT integration

## 📁 Project Structure

```
IIOT/
├── server.cjs                 # Backend server (Port 3001)
├── start.sh                   # Quick start script
├── src/
│   ├── components/
│   │   ├── dashboard/
│   │   │   ├── Overview.jsx      # Main dashboard with actuators
│   │   │   ├── Data.jsx          # Sensor data & charts
│   │   │   ├── RAMCalculator.jsx # Predictive maintenance
│   │   │   └── Settings.jsx      # PLC & OTA controls
│   │   ├── Sidebar.jsx
│   │   └── Navbar.jsx
│   ├── hooks/
│   │   ├── useMQTT.js           # MQTT connection hook
│   │   └── useSensorData.js     # Sensor data management
│   ├── services/
│   │   └── mqttService.js       # MQTT service layer
│   ├── utils/
│   │   ├── notifications.js     # Browser notifications
│   │   └── settingsStorage.js   # Settings persistence
│   └── config/
│       └── mqtt.config.js       # MQTT configuration
├── integration-scripts/
│   ├── openplc_bridge.py        # OpenPLC integration
│   └── scada_db_bridge.py       # SCADA database bridge
└── examples/
    └── esp32_mqtt_example.ino   # ESP32 example code
```

## 🔌 MQTT Integration

### Topics Configuration

**Sensor Data:**
- `iiot/sensor/temperature` - Temperature readings (°C)
- `iiot/sensor/humidity` - Humidity readings (%)
- `iiot/sensor/pressure` - Pressure readings (Bar)
- `iiot/sensor/co2` - CO2 gas concentration (ppm)

**Actuator Control:**
- `iiot/actuator/motor` - Motor control
- `iiot/actuator/pump` - Pump control
- `iiot/actuator/fan` - Fan control
- `iiot/actuator/heater` - Heater control
- `iiot/actuator/valve` - Valve control
- `iiot/actuator/compressor` - Compressor control
- `iiot/actuator/status` - All actuators status

**Machine Status:**
- `iiot/machine/status` - Operational status
- `iiot/machine/speed` - Current speed
- `iiot/machine/output` - Production output

**KPI Metrics:**
- `iiot/kpi/oee` - Overall Equipment Effectiveness
- `iiot/kpi/availability` - Machine availability
- `iiot/kpi/performance` - Performance efficiency
- `iiot/kpi/quality` - Quality metrics

### Message Format

All MQTT messages use JSON format:

```json
{
  "value": 25.5,
  "unit": "°C",
  "timestamp": 1634567890,
  "trend": 2.5
}
```

### Actuator Message Format

```json
{
  "state": true,
  "timestamp": 1634567890,
  "device": "motor"
}
```

## 🔧 MQTT Broker Setup

### Install Mosquitto

**Ubuntu/Debian:**
```bash
sudo apt-get install mosquitto mosquitto-clients
sudo systemctl enable mosquitto
sudo systemctl start mosquitto
```

**macOS:**
```bash
brew install mosquitto
brew services start mosquitto
```

**Windows:**
Download from [mosquitto.org](https://mosquitto.org/download/)

### Enable WebSocket Support

Edit `/etc/mosquitto/mosquitto.conf`:
```
listener 1883
protocol mqtt

listener 8080
protocol websockets
```

Restart Mosquitto:
```bash
sudo systemctl restart mosquitto
```

## 🎮 Backend API Endpoints

### 1. Open OpenPLC Editor
```bash
POST http://localhost:3001/api/open-plc-editor
```

**Response:**
```json
{
  "success": true,
  "message": "OpenPLC Editor opened successfully"
}
```

### 2. Send OTA Update
```bash
POST http://localhost:3001/api/send-ota
Content-Type: application/json

{
  "programFile": "program.st",
  "targetDevice": "ESP32-001"
}
```

### 3. Update MQTT Configuration
```bash
POST http://localhost:3001/api/update-mqtt-config
Content-Type: application/json

{
  "host": "broker.example.com",
  "port": 8883,
  "username": "user",
  "password": "pass"
}
```

### 4. Health Check
```bash
GET http://localhost:3001/api/health
```

## 🤖 ESP32 Integration

### Required Libraries
- PubSubClient (MQTT)
- ArduinoJson
- WiFi (built-in)

### Example Code
See `examples/esp32_mqtt_example.ino` for complete implementation.

**Basic Structure:**
```cpp
#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

const char* mqtt_server = "your-broker-ip";
const int mqtt_port = 1883;

WiFiClient espClient;
PubSubClient client(espClient);

void publishSensorData() {
  StaticJsonDocument<200> doc;
  doc["value"] = readTemperature();
  doc["unit"] = "°C";
  doc["timestamp"] = millis();

  char buffer[256];
  serializeJson(doc, buffer);
  client.publish("iiot/sensor/temperature", buffer);
}
```

## 📱 Features Walkthrough

### Dashboard Overview
- Real-time sensor readings with trend indicators
- Actuator control switches
- System runtime monitoring
- MQTT connection status

### Log Data Page
- Sensor selection dropdown
- Real-time trend charts
- Data export functionality
- Statistics (Max, Avg, Min)

### RAM Calculator
- Input operational parameters
- Calculate reliability metrics
- Analyze availability percentages
- Generate maintenance schedules

### Settings Page
- MQTT broker configuration
- Browser notification preferences
- OpenPLC Editor launcher
- OTA program upload

## 🛠️ Customization

### Adding New Sensors

1. **Update MQTT config** (`src/config/mqtt.config.js`):
```javascript
topics: {
  newSensor: 'iiot/sensor/newsensor',
}
```

2. **Add to hook** (`src/hooks/useSensorData.js`):
```javascript
const newSensorRaw = useSensorData(topics.newSensor);
```

3. **Add visualization** in dashboard components

### Changing Theme Colors

Edit `tailwind.config.js`:
```javascript
theme: {
  extend: {
    colors: {
      primary: '#your-color',
    }
  }
}
```

## 🚢 Production Deployment

1. **Build the application:**
```bash
npm run build
```

2. **Deploy `dist` folder** to your web server

3. **Configure production MQTT:**
   - Use SSL/TLS (wss://)
   - Enable authentication
   - Configure CORS properly
   - Set up rate limiting

4. **Environment variables:**
```env
VITE_MQTT_HOST=broker.example.com
VITE_MQTT_PORT=8883
VITE_MQTT_PROTOCOL=wss
```

## 🔒 Security Considerations

- ✅ Use SSL/TLS for MQTT (wss://) in production
- ✅ Implement MQTT broker authentication
- ✅ Use environment variables for credentials
- ✅ Enable CORS restrictions
- ✅ Implement rate limiting
- ✅ Sanitize all inputs
- ✅ Add API authentication

## 🐛 Troubleshooting

### MQTT Connection Issues

**Check broker status:**
```bash
sudo systemctl status mosquitto
```

**Test MQTT connection:**
```bash
mosquitto_sub -h localhost -t "iiot/#" -v
```

**Verify WebSocket port:**
```bash
netstat -an | grep 8080
```

### Backend Issues

**Check if backend is running:**
```bash
curl http://localhost:3001/api/health
```

**Restart backend:**
```bash
npm run server
```

### OpenPLC Editor Not Opening

**Make script executable:**
```bash
chmod +x ~/Documents/OpenPLC_Editor/openplc_editor.sh
```

**Test manually:**
```bash
cd ~/Documents/OpenPLC_Editor
./openplc_editor.sh
```

## 📚 Available Scripts

- `npm run dev` - Start development server
- `npm run server` - Start backend server
- `npm run dev:all` - Start both frontend and backend
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 📊 Project Stats

- 42 files
- 14,438 lines of code
- 4 sensor types
- 6 actuators
- Real-time MQTT integration

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

## 👤 Author

**Maulvin Nazir**
- GitHub: [@mauldevrinz](https://github.com/mauldevrinz)
- LinkedIn: [maulvinnazir](https://linkedin.com/in/maulvinnazir)
- Instagram: [@nazirrrvyn](https://instagram.com/nazirrrvyn)

## 🙏 Acknowledgments

- Built with React and Vite
- MQTT implementation using MQTT.js
- Charts powered by Recharts
- Icons by Lucide React
- Generated with Claude Code

---

Made with ❤️ for Industrial IoT

**Repository:** https://github.com/mauldevrinz/Industrial_IOT
