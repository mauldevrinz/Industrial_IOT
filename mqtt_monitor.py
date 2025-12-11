#!/usr/bin/env python3
"""
Simple MQTT monitor - subscribes to sensor topics and displays data
Shows 1 line per second for clean output
"""

import json
import paho.mqtt.client as mqtt
from datetime import datetime
from collections import defaultdict

class MQTTMonitor:
    def __init__(self, broker="broker.hivemq.com", port=1883, topic_prefix="iiot/sensors"):
        self.broker = broker
        self.port = port
        self.topic_prefix = topic_prefix
        self.mqtt_client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION1, client_id="mqtt-monitor")
        self.last_data = defaultdict(dict)
        self.last_print_time = 0
        
        # Setup callbacks
        self.mqtt_client.on_connect = self.on_connect
        self.mqtt_client.on_message = self.on_message
        self.mqtt_client.on_disconnect = self.on_disconnect
    
    def on_connect(self, client, userdata, flags, rc):
        if rc == 0:
            print("[✓] Connected to MQTT broker")
            client.subscribe(f"{self.topic_prefix}/all")
            client.subscribe(f"{self.topic_prefix}/adxl345")
            client.subscribe(f"{self.topic_prefix}/mpu6050")
            client.subscribe(f"{self.topic_prefix}/bmp280")
        else:
            print(f"[✗] Connection failed with code {rc}")
    
    def on_disconnect(self, client, userdata, rc):
        if rc != 0:
            print(f"[!] Unexpected MQTT disconnection with code {rc}")
    
    def on_message(self, client, userdata, msg):
        try:
            topic = msg.topic
            payload = msg.payload.decode('utf-8')
            
            # Parse JSON if it's data
            try:
                data = json.loads(payload)
            except:
                data = payload
            
            # Store latest data
            if "all" in topic:
                self.last_data['all'] = data
            elif "adxl345" in topic:
                self.last_data['adxl345'] = data
            elif "mpu6050" in topic:
                self.last_data['mpu6050'] = data
            elif "bmp280" in topic:
                self.last_data['bmp280'] = data
            
            # Print data every 1 second (for real-time monitoring)
            import time
            current_time = time.time()
            if current_time - self.last_print_time >= 1.0:
                self.print_data()
                self.last_print_time = current_time
        except Exception as e:
            pass  # Silent - skip errors
    
    def print_data(self):
        """Print formatted sensor data"""
        all_data = self.last_data.get('all', {})
        if not all_data:
            return
        
        adxl = all_data.get('adxl345', {})
        mpu = all_data.get('mpu6050', {})
        bmp = all_data.get('bmp280', {})
        ts = all_data.get('timestamp', 'N/A')
        
        # Format: same as ESP32 reader output
        output = f"[✓] TS:{ts} | "
        output += f"ADXL345(ax:{adxl.get('ax', 0):.2f},ay:{adxl.get('ay', 0):.2f},az:{adxl.get('az', 0):.2f}) | "
        
        accel = mpu.get('accel', {})
        gyro = mpu.get('gyro', {})
        output += f"MPU6050(ax:{accel.get('x', 0):.2f},ay:{accel.get('y', 0):.2f},az:{accel.get('z', 0):.2f},"
        output += f"gx:{gyro.get('x', 0):.4f},gy:{gyro.get('y', 0):.4f},gz:{gyro.get('z', 0):.4f},"
        output += f"t:{mpu.get('temp', 0):.2f}) | "
        
        output += f"BMP280(t:{bmp.get('temp', 0):.2f},p:{bmp.get('pressure', 0):.2f},alt:{bmp.get('altitude', 0):.2f})"
        
        print(output)
    
    def run(self):
        """Start MQTT monitor"""
        print(f"[*] MQTT Monitor connecting to {self.broker}:{self.port}")
        self.mqtt_client.connect(self.broker, self.port, keepalive=60)
        self.mqtt_client.loop_forever()

if __name__ == "__main__":
    monitor = MQTTMonitor()
    try:
        monitor.run()
    except KeyboardInterrupt:
        print("\n[*] Stopping MQTT monitor")
        monitor.mqtt_client.disconnect()
