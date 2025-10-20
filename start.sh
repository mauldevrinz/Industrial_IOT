#!/bin/bash

# IIoT Dashboard Startup Script
# This script starts both frontend and backend servers

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

# Display configuration
echo "📡 MQTT Configuration:"
echo "   Broker: broker.hivemq.com"
echo "   Frontend Port: 8000 (WebSocket)"
echo "   Backend Port: 1883 (TCP)"
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

# Display server information
echo "🌐 Starting Services:"
echo "   - Frontend (Vite): http://localhost:5173"
echo "   - Backend (Express): http://localhost:3001"
echo ""

echo "💡 Tips:"
echo "   - Dashboard will auto-connect to MQTT broker"
echo "   - Press Ctrl+C to stop all services"
echo "   - Check MQTT status in dashboard navbar"
echo ""

echo "📝 Test MQTT with:"
echo "   mosquitto_pub -h broker.hivemq.com -t \"iiot/sensor/temperature\" -m '{\"value\": 25.5}'"
echo ""

echo "════════════════════════════════════════════════════════════"
echo ""

# Start both servers using concurrently
npm run dev:all
