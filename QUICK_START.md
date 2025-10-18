# 🚀 Quick Start Guide - IIoT Dashboard

## ✅ Setup Complete!

Your IIoT Dashboard is now fully configured with:
- ✅ Frontend (React + Vite)
- ✅ Backend Server (Express)
- ✅ OpenPLC Editor Integration
- ✅ OTA Update Functionality
- ✅ MQTT Actuator Control

---

## 🎯 How to Run

### Method 1: One Command (Recommended)

```bash
./start.sh
```

This will start both frontend and backend servers automatically!

### Method 2: Using npm

```bash
npm run dev:all
```

### Method 3: Separate Terminals

**Terminal 1 - Frontend:**
```bash
npm run dev
```

**Terminal 2 - Backend:**
```bash
npm run server
```

---

## 🌐 Access URLs

- **Dashboard**: http://localhost:5174
- **Backend API**: http://localhost:3001
- **Health Check**: http://localhost:3001/api/health

---

## 🎮 Features Demo

### 1. Dashboard Overview
- View real-time sensor data (Temperature, Humidity, Pressure, Vibration)
- Control actuators (Motor, Pump, Fan, Heater, Valve, Compressor)
- Monitor system runtime

### 2. Log Data Page
- Select different sensors
- View trend charts
- Export data to CSV
- See statistics (Max, Avg, Min)

### 3. RAM Calculator
- Calculate Reliability metrics
- Analyze Availability
- Monitor Maintainability (MTTR)
- Get maintenance recommendations

### 4. Settings Page

**OpenPLC Editor:**
1. Click "Open PLC Editor" button
2. OpenPLC Editor will launch automatically
3. Create your ladder logic programs

**OTA Updates:**
1. Ensure MQTT is connected (check status indicator)
2. Click "Send Program via OTA"
3. Program will be sent to your ESP32 device wirelessly

**MQTT Configuration:**
- Configure broker host and port
- Set authentication credentials
- View all MQTT topics

---

## 🔌 MQTT Integration

### Current Status
Backend server is running on: http://localhost:3001

### Actuator Control
When you toggle actuators in the dashboard:
1. Frontend publishes to MQTT topic
2. ESP32 receives the command
3. ESP32 confirms by publishing status back
4. Dashboard updates in real-time

**Topics:**
- `iiot/actuator/motor`
- `iiot/actuator/pump`
- `iiot/actuator/fan`
- `iiot/actuator/heater`
- `iiot/actuator/valve`
- `iiot/actuator/compressor`

### Sensor Data
Dashboard subscribes to sensor topics:
- `iiot/sensor/temperature`
- `iiot/sensor/humidity`
- `iiot/sensor/pressure`
- `iiot/sensor/vibration`

---

## 🛠️ Backend Server

The backend server (`server.cjs`) is now running and provides:

### API Endpoints:

**1. Open OpenPLC Editor**
```bash
curl -X POST http://localhost:3001/api/open-plc-editor
```

**2. Send OTA Update**
```bash
curl -X POST http://localhost:3001/api/send-ota \
  -H "Content-Type: application/json" \
  -d '{"programFile":"program.st","targetDevice":"ESP32-001"}'
```

**3. Health Check**
```bash
curl http://localhost:3001/api/health
```

---

## 📝 File Structure

```
IIOT/
├── server.cjs              # Backend server (RUNNING on port 3001)
├── start.sh                # Quick start script
├── BACKEND_SETUP.md        # Detailed backend docs
├── QUICK_START.md          # This file
├── src/
│   ├── components/
│   │   ├── dashboard/
│   │   │   ├── Overview.jsx    # Main dashboard with actuators
│   │   │   ├── Data.jsx        # Sensor data & charts
│   │   │   ├── RAMCalculator.jsx
│   │   │   └── Settings.jsx    # PLC & OTA controls
│   │   ├── Sidebar.jsx
│   │   └── Navbar.jsx
│   ├── hooks/
│   │   ├── useMQTT.js         # MQTT integration
│   │   └── useSensorData.js
│   └── config/
│       └── mqtt.config.js     # MQTT topics config
```

---

## 🎨 What's New in Settings Page

### OpenPLC Editor Card (Blue)
- Launch OpenPLC Editor with one click
- Shows status messages
- Path: ~/Documents/OpenPLC_Editor

### OTA Update Card (Green)
- Send programs wirelessly to ESP32
- Real-time status updates
- Requires MQTT connection

### Improved Design
- Modern gradient cards
- Better visual hierarchy
- Responsive layout
- Status indicators

---

## 🧪 Testing

### Test OpenPLC Editor
1. Go to Settings page (http://localhost:5174/settings)
2. Click "Open PLC Editor" button
3. OpenPLC Editor should launch

### Test OTA Update
1. Ensure MQTT broker is running
2. Connect ESP32 to MQTT
3. Go to Settings page
4. Click "Send Program via OTA"
5. Watch status messages

### Test Actuator Control
1. Go to Dashboard (http://localhost:5174/)
2. Toggle any actuator switch
3. Check browser console for MQTT messages
4. ESP32 should receive command

---

## ⚡ Next Steps

1. **Configure MQTT Broker**
   - Install Mosquitto or use online broker
   - Update `src/config/mqtt.config.js`

2. **Connect ESP32**
   - Flash ESP32 with MQTT client code
   - Subscribe to actuator topics
   - Publish sensor data

3. **Customize Dashboard**
   - Add more sensors
   - Create custom widgets
   - Modify colors and themes

---

## 🐛 Troubleshooting

### Backend not working?
```bash
# Check if server is running
curl http://localhost:3001/api/health

# Restart backend
npm run server
```

### Frontend not loading?
```bash
# Check if Vite is running
# Should be on http://localhost:5174

# Restart frontend
npm run dev
```

### OpenPLC not opening?
```bash
# Make sure script is executable
chmod +x ~/Documents/OpenPLC_Editor/openplc_editor.sh

# Test manually
cd ~/Documents/OpenPLC_Editor
./openplc_editor.sh
```

---

## 📚 Documentation

- `BACKEND_SETUP.md` - Detailed backend documentation
- `README.md` - Project overview
- `src/config/mqtt.config.js` - MQTT configuration

---

## 🎉 You're All Set!

Your IIoT Dashboard is ready to use!

**Current Status:**
- ✅ Frontend: Running on port 5174
- ✅ Backend: Running on port 3001
- ✅ OpenPLC Integration: Ready
- ✅ OTA Updates: Ready
- ✅ MQTT Control: Ready

Start exploring your dashboard at: **http://localhost:5174**

---

Made with ❤️ for Industrial IoT
