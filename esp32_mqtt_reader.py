#!/usr/bin/env python3
"""
ESP32 Serial to MQTT Reader
Reads sensor data from ESP32 via serial port and publishes to HiveMQ MQTT broker
"""

import serial
import json
import paho.mqtt.client as mqtt
import time
import sys
import argparse
import glob
from datetime import datetime
from pathlib import Path

# Unbuffered output
sys.stdout = open(sys.stdout.fileno(), mode='w', buffering=1)
sys.stderr = open(sys.stderr.fileno(), mode='w', buffering=1)

def find_serial_port():
    """Auto-detect ESP32 serial port"""
    ports = glob.glob('/dev/ttyUSB*') + glob.glob('/dev/ttyACM*') + glob.glob('COM*')
    if ports:
        return ports[0]
    return None

class ESP32MQTTReader:
    def __init__(self, serial_port, baudrate=115200, mqtt_broker="broker.hivemq.com", 
                 mqtt_port=1883, mqtt_topic_prefix="iiot/sensors"):
        """Initialize the ESP32 MQTT Reader"""
        self.serial_port = serial_port
        self.baudrate = baudrate
        self.mqtt_broker = mqtt_broker
        self.mqtt_port = mqtt_port
        self.mqtt_topic_prefix = mqtt_topic_prefix
        
        self.ser = None
        self.mqtt_client = None
        self.is_connected = False
        self.last_publish_time = 0
        self.publish_interval = 1.0  # Publish setiap 1 detik
        self.latest_data = {}  # Buffer untuk data terbaru
        self.data_buffer = []  # Buffer untuk data yang dibaca
        self.last_print_time = 0  # Untuk throttling print
        self.data_count = 0  # Counter untuk data yang masuk
        
    def setup_serial(self):
        """Setup serial connection"""
        try:
            self.ser = serial.Serial(
                port=self.serial_port,
                baudrate=self.baudrate,
                timeout=1,
                parity=serial.PARITY_NONE,
                stopbits=serial.STOPBITS_ONE,
                bytesize=serial.EIGHTBITS
            )
            print(f"[✓] Serial connection established on {self.serial_port} at {self.baudrate} baud")
            return True
        except serial.SerialException as e:
            print(f"[✗] Failed to open serial port: {e}", file=sys.stderr)
            return False
    
    def setup_mqtt(self):
        """Setup MQTT client"""
        self.mqtt_client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION1, client_id="esp32-reader")
        
        self.mqtt_client.on_connect = self.on_mqtt_connect
        self.mqtt_client.on_disconnect = self.on_mqtt_disconnect
        self.mqtt_client.on_publish = self.on_mqtt_publish
        
        try:
            # Set reconnect parameters
            self.mqtt_client.reconnect_delay_set(min_delay=1, max_delay=32)
            self.mqtt_client.connect(self.mqtt_broker, self.mqtt_port, keepalive=60)
            self.mqtt_client.loop_start()
            print(f"[✓] Connected to MQTT broker at {self.mqtt_broker}:{self.mqtt_port}")
            return True
        except Exception as e:
            print(f"[✗] Failed to connect to MQTT broker: {e}", file=sys.stderr)
            return False
    
    def on_mqtt_connect(self, client, userdata, flags, rc):
        """MQTT connection callback"""
        if rc == 0:
            print("[✓] MQTT connection successful")
            self.is_connected = True
        else:
            print(f"[✗] MQTT connection failed with code {rc}", file=sys.stderr)
            self.is_connected = False
    
    def on_mqtt_disconnect(self, client, userdata, rc):
        """MQTT disconnect callback"""
        if rc != 0:
            pass  # Silent - will auto-reconnect
        self.is_connected = False
    
    def on_mqtt_publish(self, client, userdata, mid):
        """MQTT publish callback"""
        pass  # Silent publish confirmation
    
    def parse_and_publish(self, data_str):
        """Parse JSON data and publish to MQTT"""
        try:
            # Clean up data
            data_str = data_str.strip()
            
            # Skip if doesn't look like JSON
            if not data_str.startswith('{'):
                return
            
            # Try to find valid JSON by removing corrupted start
            if not data_str.startswith('{"timestamp'):
                start_idx = data_str.find('{"timestamp')
                if start_idx != -1:
                    data_str = data_str[start_idx:]
                else:
                    return
            
            data = json.loads(data_str)
            
            # Validate that we have required fields
            if "adxl345" not in data or "mpu6050" not in data or "bmp280" not in data:
                return
            
            # Add reception timestamp if not present
            if "reception_time" not in data:
                data["reception_time"] = datetime.now().isoformat()
            
            # Store latest data
            self.latest_data = data
            
            # Check if 1 second has passed since last publish
            current_time = time.time()
            if current_time - self.last_publish_time >= self.publish_interval:
                # Publish main data
                main_topic = f"{self.mqtt_topic_prefix}/all"
                self.mqtt_client.publish(main_topic, json.dumps(data), qos=1, retain=False)
                
                # Publish individual sensor data
                if "adxl345" in data:
                    adxl_topic = f"{self.mqtt_topic_prefix}/adxl345"
                    self.mqtt_client.publish(adxl_topic, json.dumps(data["adxl345"]), qos=1, retain=False)
                    
                    # Publish individual axes
                    for axis in ["ax", "ay", "az"]:
                        if axis in data["adxl345"]:
                            axis_topic = f"{self.mqtt_topic_prefix}/adxl345/{axis}"
                            self.mqtt_client.publish(axis_topic, str(data["adxl345"][axis]), qos=1, retain=True)
                
                if "mpu6050" in data:
                    mpu_topic = f"{self.mqtt_topic_prefix}/mpu6050"
                    self.mqtt_client.publish(mpu_topic, json.dumps(data["mpu6050"]), qos=1, retain=False)
                    
                    # Publish accel data
                    if "accel" in data["mpu6050"]:
                        accel_data = data["mpu6050"]["accel"]
                        for axis in ["x", "y", "z"]:
                            if axis in accel_data:
                                topic = f"{self.mqtt_topic_prefix}/mpu6050/accel/{axis}"
                                self.mqtt_client.publish(topic, str(accel_data[axis]), qos=1, retain=True)
                    
                    # Publish gyro data
                    if "gyro" in data["mpu6050"]:
                        gyro_data = data["mpu6050"]["gyro"]
                        for axis in ["x", "y", "z"]:
                            if axis in gyro_data:
                                topic = f"{self.mqtt_topic_prefix}/mpu6050/gyro/{axis}"
                                self.mqtt_client.publish(topic, str(gyro_data[axis]), qos=1, retain=True)
                    
                    # Publish temperature
                    if "temp" in data["mpu6050"]:
                        temp_topic = f"{self.mqtt_topic_prefix}/mpu6050/temp"
                        self.mqtt_client.publish(temp_topic, str(data["mpu6050"]["temp"]), qos=1, retain=True)
                
                if "bmp280" in data:
                    bmp_topic = f"{self.mqtt_topic_prefix}/bmp280"
                    self.mqtt_client.publish(bmp_topic, json.dumps(data["bmp280"]), qos=1, retain=False)
                    
                    # Publish individual parameters
                    for param in ["temp", "pressure", "altitude"]:
                        if param in data["bmp280"]:
                            param_topic = f"{self.mqtt_topic_prefix}/bmp280/{param}"
                            self.mqtt_client.publish(param_topic, str(data["bmp280"][param]), qos=1, retain=True)
                
                # Update last publish time
                self.last_publish_time = current_time
                
                # Print data (throttled to once per 300ms)
                if current_time - self.last_print_time >= 0.3:
                    adxl = data.get('adxl345', {})
                    mpu = data.get('mpu6050', {})
                    bmp = data.get('bmp280', {})
                    ts = data.get('timestamp', 0)
                    
                    print(f"[✓] TS:{ts} | "
                          f"ADXL345(ax:{adxl.get('ax', 0):.2f},ay:{adxl.get('ay', 0):.2f},az:{adxl.get('az', 0):.2f}) | "
                          f"MPU6050(ax:{mpu.get('accel', {}).get('x', 0):.2f},ay:{mpu.get('accel', {}).get('y', 0):.2f},az:{mpu.get('accel', {}).get('z', 0):.2f},"
                          f"gx:{mpu.get('gyro', {}).get('x', 0):.4f},gy:{mpu.get('gyro', {}).get('y', 0):.4f},gz:{mpu.get('gyro', {}).get('z', 0):.4f},"
                          f"t:{mpu.get('temp', 0):.2f}) | "
                          f"BMP280(t:{bmp.get('temp', 0):.2f},p:{bmp.get('pressure', 0):.2f},alt:{bmp.get('altitude', 0):.2f})")
                    
                    self.last_print_time = current_time
            
        except json.JSONDecodeError:
            pass  # Silent - skip invalid JSON
        except Exception:
            pass  # Silent - skip errors
    
    def run(self):
        """Main loop to read serial and publish to MQTT"""
        print("\n[*] Starting ESP32 Serial to MQTT Reader")
        print(f"[*] Configuration:")
        print(f"    - Serial Port: {self.serial_port}")
        print(f"    - Baudrate: {self.baudrate}")
        print(f"    - MQTT Broker: {self.mqtt_broker}:{self.mqtt_port}")
        print(f"    - MQTT Topic Prefix: {self.mqtt_topic_prefix}")
        print(f"\n[*] Press Ctrl+C to stop\n")
        
        if not self.setup_serial():
            return False
        
        if not self.setup_mqtt():
            return False
        
        # Wait for MQTT connection
        timeout = time.time() + 5
        while not self.is_connected and time.time() < timeout:
            time.sleep(0.1)
        
        if not self.is_connected:
            print("[!] Warning: MQTT connection not established yet, but continuing...", file=sys.stderr)
        
        buffer = ""
        last_read_time = time.time()
        try:
            while True:
                if self.ser and self.ser.in_waiting:
                    try:
                        chunk = self.ser.read(self.ser.in_waiting).decode('utf-8', errors='ignore')
                        buffer += chunk
                        last_read_time = time.time()
                        
                        while '\n' in buffer:
                            line, buffer = buffer.split('\n', 1)
                            if line.strip():
                                self.parse_and_publish(line)
                    except Exception as e:
                        print(f"[!] Error reading serial: {e}", file=sys.stderr)
                        buffer = ""
                        continue
                else:
                    # If buffer has data but no more input for 100ms, process incomplete line
                    if buffer and (time.time() - last_read_time) > 0.1:
                        if buffer.strip():
                            self.parse_and_publish(buffer)
                        buffer = ""
                
                time.sleep(0.01)
        
        except KeyboardInterrupt:
            print("\n[*] Shutting down...")
        
        finally:
            self.cleanup()
    
    def cleanup(self):
        """Cleanup resources"""
        if self.ser and self.ser.is_open:
            self.ser.close()
            print("[✓] Serial connection closed")
        
        if self.mqtt_client:
            self.mqtt_client.loop_stop()
            self.mqtt_client.disconnect()
            print("[✓] MQTT connection closed")


def main():
    parser = argparse.ArgumentParser(
        description='ESP32 Serial to HiveMQ MQTT Reader',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog='''
Examples:
  python3 esp32_mqtt_reader.py                    (auto-detect port)
  python3 esp32_mqtt_reader.py /dev/ttyUSB0
  python3 esp32_mqtt_reader.py /dev/ttyUSB0 --broker test.mosquitto.org
  python3 esp32_mqtt_reader.py COM3 --broker broker.hivemq.com --topic-prefix home/sensors
        '''
    )
    
    parser.add_argument('serial_port', nargs='?', default=None, help='Serial port (e.g., /dev/ttyUSB0 or COM3). Auto-detect if not specified.')
    parser.add_argument('-b', '--baudrate', type=int, default=115200, help='Serial baudrate (default: 115200)')
    parser.add_argument('--broker', default='broker.hivemq.com', help='MQTT broker address (default: broker.hivemq.com)')
    parser.add_argument('--port', type=int, default=1883, help='MQTT port (default: 1883)')
    parser.add_argument('--topic-prefix', default='iiot/sensors', help='MQTT topic prefix (default: iiot/sensors)')
    
    args = parser.parse_args()
    
    # Auto-detect serial port if not provided
    serial_port = args.serial_port
    if not serial_port:
        serial_port = find_serial_port()
        if not serial_port:
            print("[✗] No serial port found. Please specify manually.", file=sys.stderr)
            print("    Usage: python3 esp32_mqtt_reader.py /dev/ttyUSB0", file=sys.stderr)
            sys.exit(1)
        print(f"[*] Auto-detected serial port: {serial_port}")
    
    reader = ESP32MQTTReader(
        serial_port=serial_port,
        baudrate=args.baudrate,
        mqtt_broker=args.broker,
        mqtt_port=args.port,
        mqtt_topic_prefix=args.topic_prefix
    )
    
    reader.run()


if __name__ == '__main__':
    main()
