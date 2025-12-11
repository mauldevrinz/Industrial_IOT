#!/usr/bin/env python3
"""
Training Data Recorder for Edge Impulse
Records sensor data from ESP32 via serial and saves in Edge Impulse JSON format
"""

import serial
import time
import json
import sys
from datetime import datetime

class TrainingDataRecorder:
    def __init__(self, port, duration_seconds=30, label="Unknown"):
        self.port = port
        self.duration = duration_seconds
        self.label = label
        self.samples = []
        self.interval_ms = 100  # 10Hz sampling rate
        
    def parse_serial_line(self, line):
        """Parse serial line and extract sensor data"""
        try:
            # Try JSON format first (current format)
            if line.strip().startswith('{'):
                data = json.loads(line)
                
                # Extract from JSON format
                sample = [
                    data['adxl345']['ax'],          # ax1
                    data['adxl345']['ay'],          # ay1
                    data['adxl345']['az'],          # az1
                    data['mpu6050']['accel']['x'],  # ax2
                    data['mpu6050']['accel']['y'],  # ay2
                    data['mpu6050']['accel']['z'],  # az2
                    data['mpu6050']['gyro']['x'],   # gx
                    data['mpu6050']['gyro']['y'],   # gy
                    data['mpu6050']['gyro']['z']    # gz
                ]
                
                return sample
            
            # Fallback to old format
            # Example line: [✓] TS:123456 | ADXL345(ax:0.04,ay:10.51,az:-1.61) | MPU6050(...)
            
            if '[✓]' not in line:
                return None
            
            # Extract ADXL345 data
            adxl_start = line.find('ADXL345(') + 8
            adxl_end = line.find(')', adxl_start)
            adxl_data = line[adxl_start:adxl_end]
            
            # Extract MPU6050 data
            mpu_start = line.find('MPU6050(') + 8
            mpu_end = line.find(')', mpu_start)
            mpu_data = line[mpu_start:mpu_end]
            
            # Parse ADXL345 (ax, ay, az)
            adxl_parts = {}
            for part in adxl_data.split(','):
                key, val = part.split(':')
                adxl_parts[key] = float(val)
            
            # Parse MPU6050 (ax, ay, az, gx, gy, gz)
            mpu_parts = {}
            for part in mpu_data.split(','):
                if ':' in part:
                    key, val = part.split(':')
                    mpu_parts[key] = float(val)
            
            # Create sample in Edge Impulse format (9 axes)
            sample = [
                adxl_parts['ax'],  # ax1
                adxl_parts['ay'],  # ay1
                adxl_parts['az'],  # az1
                mpu_parts['ax'],   # ax2
                mpu_parts['ay'],   # ay2
                mpu_parts['az'],   # az2
                mpu_parts['gx'],   # gx
                mpu_parts['gy'],   # gy
                mpu_parts['gz']    # gz
            ]
            
            return sample
            
        except Exception as e:
            # Silent fail for non-parseable lines
            return None
    
    def record(self):
        """Record training data for specified duration"""
        print(f"🎙️  Training Data Recorder")
        print(f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
        print(f"📝 Label: {self.label}")
        print(f"⏱️  Duration: {self.duration} seconds")
        print(f"📊 Sample Rate: {1000/self.interval_ms:.0f}Hz ({self.interval_ms}ms)")
        print(f"🔌 Port: {self.port}")
        print(f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
        print(f"")
        
        try:
            # Open serial port
            ser = serial.Serial(self.port, 115200, timeout=1)
            print(f"✅ Serial port opened")
            print(f"")
            
            # Wait for stable data
            print(f"⏳ Waiting for stable sensor data...")
            stable_count = 0
            while stable_count < 5:
                line = ser.readline().decode('utf-8', errors='ignore').strip()
                sample = self.parse_serial_line(line)
                if sample:
                    stable_count += 1
                    print(f"   Stable reading {stable_count}/5")
            
            print(f"")
            print(f"🔴 RECORDING STARTED")
            print(f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
            
            start_time = time.time()
            sample_count = 0
            last_progress = 0
            
            while (time.time() - start_time) < self.duration:
                line = ser.readline().decode('utf-8', errors='ignore').strip()
                
                if line:
                    sample = self.parse_serial_line(line)
                    if sample:
                        self.samples.append(sample)
                        sample_count += 1
                        
                        # Show progress every 10%
                        elapsed = time.time() - start_time
                        progress = int((elapsed / self.duration) * 100)
                        
                        if progress >= last_progress + 10:
                            print(f"📊 {progress}% - {sample_count} samples - {elapsed:.1f}s / {self.duration}s")
                            last_progress = progress
            
            ser.close()
            
            print(f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
            print(f"✅ RECORDING COMPLETED")
            print(f"")
            print(f"📊 Total samples: {sample_count}")
            print(f"⏱️  Actual duration: {time.time() - start_time:.1f}s")
            print(f"📈 Average rate: {sample_count / (time.time() - start_time):.1f}Hz")
            print(f"")
            
            return True
            
        except serial.SerialException as e:
            print(f"❌ Serial error: {e}")
            return False
        except KeyboardInterrupt:
            print(f"\n⚠️  Recording interrupted by user")
            return False
    
    def save_to_json(self, filename):
        """Save recorded data in Edge Impulse JSON format"""
        if not self.samples:
            print(f"❌ No samples to save!")
            return False
        
        # Flatten samples into single array
        values = []
        for sample in self.samples:
            values.extend(sample)
        
        # Create Edge Impulse JSON structure
        data = {
            "protected": {
                "ver": "v1",
                "alg": "HS256",
                "iat": int(time.time())
            },
            "signature": "0" * 50,  # Dummy signature
            "payload": {
                "device_type": "EDGE_IMPULSE_UPLOADER",
                "interval_ms": self.interval_ms,
                "sensors": [
                    {"name": "ax1", "units": "N/A"},
                    {"name": "ay1", "units": "N/A"},
                    {"name": "az1", "units": "N/A"},
                    {"name": "ax2", "units": "N/A"},
                    {"name": "ay2", "units": "N/A"},
                    {"name": "az2", "units": "N/A"},
                    {"name": "gx", "units": "N/A"},
                    {"name": "gy", "units": "N/A"},
                    {"name": "gz", "units": "N/A"}
                ],
                "values": values
            }
        }
        
        try:
            with open(filename, 'w') as f:
                json.dump(data, f, indent=2)
            
            print(f"✅ Data saved to: {filename}")
            print(f"")
            print(f"📦 File details:")
            print(f"   Samples: {len(self.samples)}")
            print(f"   Values: {len(values)}")
            print(f"   Duration: {len(self.samples) * self.interval_ms / 1000:.1f}s")
            print(f"   Label: {self.label}")
            print(f"")
            print(f"✨ Ready to upload to Edge Impulse!")
            
            return True
            
        except Exception as e:
            print(f"❌ Save error: {e}")
            return False

def main():
    if len(sys.argv) < 3:
        print(f"Usage: {sys.argv[0]} <serial_port> <label> [duration_seconds]")
        print(f"")
        print(f"Example:")
        print(f"  {sys.argv[0]} /dev/ttyUSB0 Normal 30")
        print(f"  {sys.argv[0]} /dev/ttyUSB0 Drop_Voltage 30")
        sys.exit(1)
    
    port = sys.argv[1]
    label = sys.argv[2]
    duration = int(sys.argv[3]) if len(sys.argv) > 3 else 30
    
    # Create recorder
    recorder = TrainingDataRecorder(port, duration, label)
    
    # Record data
    if recorder.record():
        # Generate filename with timestamp
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{label}_{timestamp}.json"
        
        # Save to file
        recorder.save_to_json(filename)

if __name__ == "__main__":
    main()
