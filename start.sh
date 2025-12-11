#!/bin/bash

# IIoT Dashboard Startup Script
# This script starts frontend, backend, and ESP32 MQTT Reader

echo "════════════════════════════════════════════════════════════"
echo "🚀 IIoT Dashboard Startup Script"
echo "════════════════════════════════════════════════════════════"
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

# Check Python dependencies for MQTT Reader
echo "🔍 Checking Python dependencies..."
if ! python3 -c "import serial, paho.mqtt" 2>/dev/null; then
    echo "⚠️  Installing Python MQTT dependencies..."
    pip install -q pyserial paho-mqtt
fi
echo ""

# Display configuration
echo "📡 MQTT Configuration:"
echo "   Broker: broker.hivemq.com"
echo "   Port: 1883"
echo "   Topic Prefix: iiot/sensors"
echo ""

# Check MQTT broker connectivity
echo "🔍 Checking MQTT broker connectivity..."
if command -v nc &> /dev/null; then
    if nc -zv broker.hivemq.com 1883 2>&1 | grep -q "succeeded\|open"; then
        echo "   ✅ MQTT broker is reachable"
    else
        echo "   ⚠️  Warning: Cannot reach broker.hivemq.com"
        echo "   Please check your internet connection"
    fi
else
    echo "   ℹ️  Install 'netcat' to check broker connectivity"
fi
echo ""

# Check USB device - retry a few times since device might not be ready immediately
echo "🔌 Checking ESP32 USB connection..."
SERIAL_PORT=""
for i in {1..5}; do
    SERIAL_PORT=$(ls /dev/ttyUSB* /dev/ttyACM* 2>/dev/null | head -1)
    if [ ! -z "$SERIAL_PORT" ]; then
        echo "   ✅ ESP32 found on: $SERIAL_PORT"
        break
    fi
    if [ $i -lt 5 ]; then
        sleep 1
    fi
done

if [ -z "$SERIAL_PORT" ]; then
    echo "   ⚠️  Warning: No USB serial device found"
    echo "   Make sure ESP32 is connected via USB"
fi
echo ""

# Display server information
echo "🌐 Starting Services:"
echo "   - ESP32 MQTT Reader (Python)"
echo "   - Edge Impulse Classifier (Node.js)"
echo "   - Frontend (Vite): http://localhost:5173"
echo "   - Backend (Express): http://localhost:3001"
echo ""

echo "💡 Tips:"
echo "   - Dashboard will auto-connect to MQTT broker"
echo "   - ESP32 sensor data updates in real-time"
echo "   - Press Ctrl+C to stop all services"
echo "   - Check MQTT status in dashboard navbar"
echo ""

echo "📊 View ESP32 data with:"
echo "   mosquitto_sub -h broker.hivemq.com -t 'iiot/sensors/#'"
echo ""

echo "════════════════════════════════════════════════════════════"
echo ""

# Kill any existing processes
echo "🧹 Cleaning up old processes..."
pkill -f "esp32_mqtt_reader" 2>/dev/null
pkill -f "mqtt_monitor" 2>/dev/null
pkill -f "mqtt_subscribe_clean" 2>/dev/null
pkill -f "mqtt_subscribe_logger" 2>/dev/null
pkill -f "classifier_v2.cjs" 2>/dev/null
sleep 1

# Start ESP32 MQTT Reader in background (if USB device exists)
ESP32_PID=""
if [ ! -z "$SERIAL_PORT" ]; then
    echo "🔄 Starting ESP32 MQTT Reader on $SERIAL_PORT..."
    nohup python3 esp32_mqtt_reader.py "$SERIAL_PORT" > esp32_mqtt_reader.log 2>&1 &
    ESP32_PID=$!
    echo "   PID: $ESP32_PID"
    echo ""
    
    # Wait for reader to stabilize
    sleep 2
    
    # Check if reader is still running
    if ps -p $ESP32_PID > /dev/null 2>&1; then
        echo "   ✅ ESP32 Reader Active - Publishing every 1 second"
        echo ""
    else
        echo "   ⚠️  Reader failed to start"
        echo ""
    fi
else
    echo "⚠️  Skipping ESP32 MQTT Reader - USB device not found"
    echo "   Run manually: python3 esp32_mqtt_reader.py /dev/ttyUSB0"
    echo ""
fi

# Start Edge Impulse Classifier in background
echo "🔄 Starting Edge Impulse Vibration Classifier..."
nohup node classifier_v2.cjs > classifier_output.log 2>&1 &
CLASSIFIER_PID=$!
echo "   PID: $CLASSIFIER_PID"
echo ""

sleep 2

# Check if classifier is still running
if ps -p $CLASSIFIER_PID > /dev/null 2>&1; then
    echo "   ✅ Classifier Active - Motor status classification running"
    echo ""
else
    echo "   ⚠️  Classifier failed to start"
    echo ""
fi

# Start frontend and backend concurrently
echo "🚀 Starting Web Services..."
echo ""

# Start backend in background
nohup npm run server > backend.log 2>&1 &
BACKEND_PID=$!

# Start frontend in background  
nohup npm run dev > frontend.log 2>&1 &
FRONTEND_PID=$!

echo "   🔹 Backend PID: $BACKEND_PID"
echo "   🔹 Frontend PID: $FRONTEND_PID"
echo ""

# Wait a moment for services to start
sleep 5

# Check if services are running
if ps -p $BACKEND_PID > /dev/null 2>&1; then
    echo "   ✅ Backend running on http://localhost:3001"
else
    echo "   ⚠️  Backend failed to start (check backend.log)"
fi

if ps -p $FRONTEND_PID > /dev/null 2>&1; then
    echo "   ✅ Frontend running on http://localhost:5173"
else
    echo "   ⚠️  Frontend failed to start (check frontend.log)"
fi

echo ""
echo "════════════════════════════════════════════════════════════"
echo "✅ All services started!"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "🌐 Access your dashboard:"
echo "   Frontend:  http://localhost:5173"
echo "   Backend:   http://localhost:3001/api/health"
echo ""
echo "📋 View live logs:"
echo "   Frontend:  tail -f frontend.log"
echo "   Backend:   tail -f backend.log"
echo "   Classifier: tail -f classifier_output.log"
echo "   ESP32:     tail -f esp32_mqtt_reader.log"
echo ""
echo "🛑 Stop services:"
echo "   bash stop.sh"
echo ""
echo "════════════════════════════════════════════════════════════"
echo ""

# Keep script running - user will press Ctrl+C to stop
echo "⏳ Services are running. Press Ctrl+C to stop all services..."
echo ""

# Cleanup on exit (when script terminates naturally or by signal)
trap "
    echo ''
    echo '🛑 Received shutdown signal...'
    echo '⏹️  Stopping all services...'
    kill $ESP32_PID $CLASSIFIER_PID $BACKEND_PID $FRONTEND_PID 2>/dev/null
    wait 2>/dev/null
    echo '✅ All services stopped'
    exit 0
" EXIT INT TERM

# Keep the script alive by waiting for any of the child processes
# If any process dies, the script will continue
wait
