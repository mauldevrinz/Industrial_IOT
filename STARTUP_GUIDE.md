# IIoT Dashboard - Startup & Shutdown Guide

## Quick Start

### Start All Services
```bash
cd /home/maulvin/Documents/IIOT
./start.sh
```

Atau:
```bash
bash start.sh
```

### Stop All Services
```bash
./stop.sh
```

Atau:
```bash
bash stop.sh
```

## What Gets Started

✅ **ESP32 MQTT Reader** (Python)
- Reads sensor data from ESP32 via USB serial
- Publishes to HiveMQ MQTT broker
- Auto-retries connection if lost

✅ **Edge Impulse Classifier** (Node.js)
- Processes vibration data
- Classifies motor status (Normal/Drop_Voltage)
- Subscribes to MQTT sensor topics

✅ **Backend API** (Express.js) on port 3001
- API endpoints for OpenPLC, OTA updates
- MQTT configuration management
- Health check endpoint

✅ **Frontend Dashboard** (Vite) on port 5173
- Real-time sensor visualization
- MQTT connection status
- Live motor status monitoring

## Access Points

- **Dashboard**: http://localhost:5173
- **API Health**: http://localhost:3001/api/health

## View Logs in Real-time

```bash
# Frontend
tail -f frontend.log

# Backend
tail -f backend.log

# Classifier
tail -f classifier_output.log

# ESP32 Reader
tail -f esp32_mqtt_reader.log
```

## Test MQTT Data Flow

```bash
mosquitto_sub -h broker.hivemq.com -t 'iiot/sensors/#'
```

## Troubleshooting

### Services not starting?
Check the logs:
```bash
tail -50 startup.log  # Overall startup log
tail -50 frontend.log  # Frontend issues
tail -50 backend.log   # Backend issues
```

### ESP32 not connecting?
- Ensure ESP32 is connected via USB
- Check serial port: `ls /dev/ttyUSB*`
- Manually start: `python3 esp32_mqtt_reader.py /dev/ttyUSB0`

### MQTT issues?
- Check internet connection
- Test broker: `nc -zv broker.hivemq.com 1883`

### Port already in use?
```bash
# Kill processes on specific ports
lsof -ti:5173 | xargs kill -9   # Frontend
lsof -ti:3001 | xargs kill -9   # Backend
```

## Performance Notes

- Frontend updates: ~100ms
- ESP32 sensor publishing: 300ms
- MQTT connection timeout: 45 seconds
- Classifier processing: Real-time

