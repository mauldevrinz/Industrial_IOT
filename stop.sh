#!/bin/bash

# IIoT Dashboard Stop Script
# This script stops all running servers and Python scripts

echo "════════════════════════════════════════════════════════════"
echo "⏹️  Stopping IIoT Dashboard Services"
echo "════════════════════════════════════════════════════════════"
echo ""

# Kill ESP32 MQTT Reader
echo "🔍 Stopping ESP32 MQTT Reader..."
if pkill -f "esp32_mqtt_reader" 2>/dev/null; then
    echo "   ✅ ESP32 reader stopped"
else
    echo "   ℹ️  No ESP32 reader running"
fi
echo ""

# Kill Classifier
echo "🔍 Stopping Edge Impulse Classifier..."
if pkill -f "classifier_v2.cjs" 2>/dev/null; then
    echo "   ✅ Classifier stopped"
else
    echo "   ℹ️  No Classifier running"
fi
echo ""

# Kill Frontend (Vite)
echo "🔍 Stopping Frontend server..."
if pkill -f "npm run dev" 2>/dev/null; then
    echo "   ✅ Frontend stopped"
else
    echo "   ℹ️  No Frontend server running"
fi
echo ""

# Kill Backend (Express)
echo "🔍 Stopping Backend server..."
if pkill -f "npm run server" 2>/dev/null; then
    echo "   ✅ Backend stopped"
else
    echo "   ℹ️  No Backend server running"
fi
echo ""

# Kill any remaining node processes related to this project
echo "🔍 Cleaning up remaining processes..."
pkill -9 -f "vite" 2>/dev/null
pkill -9 -f "node.*server" 2>/dev/null
pkill -9 -f "classifier" 2>/dev/null
echo "   ✅ All processes cleaned"
echo ""

echo "════════════════════════════════════════════════════════════"
echo "✅ All IIoT Dashboard services stopped"
echo "════════════════════════════════════════════════════════════"
echo ""
