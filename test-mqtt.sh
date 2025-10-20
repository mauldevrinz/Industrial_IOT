#!/bin/bash

# MQTT Continuous Test Script
# Sends random sensor data continuously

echo "════════════════════════════════════════════════════════════"
echo "📡 MQTT Continuous Test - Sending Random Data"
echo "════════════════════════════════════════════════════════════"
echo ""

# Check if mosquitto_pub is installed
if ! command -v mosquitto_pub &> /dev/null; then
    echo "❌ Error: mosquitto_pub not found"
    echo ""
    echo "Install with:"
    echo "   sudo apt install mosquitto-clients"
    echo ""
    exit 1
fi

BROKER="broker.hivemq.com"
INTERVAL=3  # Seconds between data transmission

echo "🎯 Target Broker: $BROKER"
echo "⏱️  Update Interval: ${INTERVAL} seconds"
echo "📝 Publishing continuous data to sensor topics..."
echo "   Press Ctrl+C to stop"
echo ""
echo "════════════════════════════════════════════════════════════"
echo ""

# Function to publish data
publish_data() {
    local topic=$1
    local data=$2
    mosquitto_pub -h $BROKER -t "$topic" -m "$data" -q 1 2>/dev/null
}

# Counter for display
COUNT=1

# Trap Ctrl+C for graceful exit
trap 'echo ""; echo ""; echo "⏹️  Stopped. Total transmissions: $COUNT"; echo ""; exit 0' INT

# Continuous loop
while true; do
    # Generate random sensor values
    TEMP=$(awk -v min=18 -v max=32 'BEGIN{srand(); printf "%.1f", min+rand()*(max-min)}')

    # Level sensors - randomly generate low and high sensor values
    # Possible combinations: 00 (empty), 10 (filling), 11 (full)
    RAND_LEVEL=$(shuf -i 0-2 -n 1)
    if [ $RAND_LEVEL -eq 0 ]; then
      LEVEL_LOW=0
      LEVEL_HIGH=0
      LEVEL_STATUS="Empty"
    elif [ $RAND_LEVEL -eq 1 ]; then
      LEVEL_LOW=1
      LEVEL_HIGH=0
      LEVEL_STATUS="Filling"
    else
      LEVEL_LOW=1
      LEVEL_HIGH=1
      LEVEL_STATUS="Full"
    fi

    PRESSURE=$(awk -v min=1.0 -v max=3.5 'BEGIN{srand(); printf "%.1f", min+rand()*(max-min)}')
    CO2_VAL=$(shuf -i 350-650 -n 1)

    # Clear previous line and show progress
    echo -ne "\r\033[K"
    echo "📊 Transmission #${COUNT} - $(date '+%H:%M:%S')"

    # Temperature data
    echo "   🌡️  Temperature: ${TEMP}°C"
    publish_data "iiot/sensor/temperature" "{\"value\": ${TEMP}, \"unit\": \"celsius\"}"

    # Level data - send both low and high sensor values
    echo "   💧 Level: ${LEVEL_STATUS} (L:${LEVEL_LOW} H:${LEVEL_HIGH})"
    publish_data "iiot/sensor/level/low" "{\"value\": ${LEVEL_LOW}}"
    publish_data "iiot/sensor/level/high" "{\"value\": ${LEVEL_HIGH}}"

    # Pressure data
    echo "   ⚡ Pressure: ${PRESSURE} bar"
    publish_data "iiot/sensor/pressure" "{\"value\": ${PRESSURE}, \"unit\": \"bar\"}"

    # CO2 data
    echo "   💨 CO2: ${CO2_VAL} ppm"
    publish_data "iiot/sensor/co2" "{\"value\": ${CO2_VAL}, \"unit\": \"ppm\"}"

    echo "   ✅ Published successfully"
    echo ""

    # Increment counter
    COUNT=$((COUNT + 1))

    # Wait before next transmission
    sleep $INTERVAL
done
