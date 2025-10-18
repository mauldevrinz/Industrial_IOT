#!/usr/bin/env python3
"""
OpenPLC to MQTT Bridge
Membaca data dari OpenPLC via Modbus TCP dan publish ke MQTT broker
untuk ditampilkan di IIOT Dashboard

Requirements:
    pip install pymodbus paho-mqtt

Author: IIOT Dashboard Team
License: MIT
"""

from pymodbus.client import ModbusTcpClient
import paho.mqtt.client as mqtt
import json
import time
import logging
from datetime import datetime

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ==================== CONFIGURATION ====================

# OpenPLC Configuration
OPENPLC_CONFIG = {
    'host': '192.168.1.10',  # Ganti dengan IP OpenPLC Anda
    'port': 502,
    'timeout': 3,
    'unit_id': 1
}

# MQTT Configuration
MQTT_CONFIG = {
    'broker': 'localhost',
    'port': 1883,
    'username': '',  # Kosongkan jika tidak pakai auth
    'password': '',
    'client_id': 'OpenPLC_Bridge'
}

# Update interval (seconds)
UPDATE_INTERVAL = 5

# Modbus Register Mapping ke MQTT Topics
# Format: 'register_type:address': {config}
REGISTER_MAPPING = {
    # Holding Registers (Read/Write) - untuk sensor values
    'holding:0': {
        'topic': 'iiot/sensor/temperature',
        'name': 'Temperature',
        'unit': '°C',
        'scale': 0.1,  # Nilai di register = nilai aktual * 10
    },
    'holding:1': {
        'topic': 'iiot/sensor/humidity',
        'name': 'Humidity',
        'unit': '%',
        'scale': 0.1,
    },
    'holding:2': {
        'topic': 'iiot/sensor/pressure',
        'name': 'Pressure',
        'unit': 'bar',
        'scale': 0.01,
    },
    'holding:3': {
        'topic': 'iiot/sensor/vibration',
        'name': 'Vibration',
        'unit': 'mm/s',
        'scale': 0.1,
    },

    # Input Registers (Read Only) - untuk machine metrics
    'input:0': {
        'topic': 'iiot/machine/speed',
        'name': 'Machine Speed',
        'unit': 'rpm',
        'scale': 1,
    },
    'input:1': {
        'topic': 'iiot/machine/output',
        'name': 'Output Count',
        'unit': 'units',
        'scale': 1,
    },
    'input:2': {
        'topic': 'iiot/kpi/oee',
        'name': 'OEE',
        'unit': '%',
        'scale': 0.1,
    },

    # Coils (Digital Outputs) - untuk status
    'coil:0': {
        'topic': 'iiot/machine/status',
        'name': 'Machine Running',
        'unit': None,
        'scale': 1,
    },
}

# ==================== MQTT CLIENT ====================

class MQTTClient:
    def __init__(self, config):
        self.config = config
        self.client = mqtt.Client(config['client_id'])

        if config['username']:
            self.client.username_pw_set(config['username'], config['password'])

        self.client.on_connect = self.on_connect
        self.client.on_disconnect = self.on_disconnect
        self.client.on_message = self.on_message

        self.connected = False

    def on_connect(self, client, userdata, flags, rc):
        if rc == 0:
            logger.info("MQTT Connected")
            self.connected = True

            # Subscribe ke command topics untuk control
            client.subscribe('iiot/command')
            client.subscribe('iiot/control')
            logger.info("Subscribed to command topics")
        else:
            logger.error(f"MQTT Connection failed with code {rc}")

    def on_disconnect(self, client, userdata, rc):
        logger.warning("MQTT Disconnected")
        self.connected = False

    def on_message(self, client, userdata, message):
        """Handle incoming control commands dari dashboard"""
        try:
            topic = message.topic
            payload = json.loads(message.payload)
            logger.info(f"Received command on {topic}: {payload}")

            # Ini akan di-handle oleh ModbusClient untuk write ke PLC
            return topic, payload

        except Exception as e:
            logger.error(f"Error handling MQTT message: {e}")
            return None, None

    def connect(self):
        try:
            self.client.connect(self.config['broker'], self.config['port'])
            self.client.loop_start()
            time.sleep(2)  # Wait for connection
            return self.connected
        except Exception as e:
            logger.error(f"MQTT Connection error: {e}")
            return False

    def publish(self, topic, payload):
        if self.connected:
            self.client.publish(topic, json.dumps(payload), qos=1)
            return True
        return False

    def disconnect(self):
        self.client.loop_stop()
        self.client.disconnect()

# ==================== MODBUS CLIENT ====================

class ModbusClient:
    def __init__(self, config):
        self.config = config
        self.client = ModbusTcpClient(
            host=config['host'],
            port=config['port'],
            timeout=config['timeout']
        )

    def connect(self):
        try:
            if self.client.connect():
                logger.info(f"Connected to OpenPLC at {self.config['host']}:{self.config['port']}")
                return True
            else:
                logger.error("Failed to connect to OpenPLC")
                return False
        except Exception as e:
            logger.error(f"Modbus connection error: {e}")
            return False

    def read_register(self, reg_type, address, count=1):
        """Read data dari Modbus register"""
        try:
            if reg_type == 'holding':
                result = self.client.read_holding_registers(
                    address, count, slave=self.config['unit_id']
                )
            elif reg_type == 'input':
                result = self.client.read_input_registers(
                    address, count, slave=self.config['unit_id']
                )
            elif reg_type == 'coil':
                result = self.client.read_coils(
                    address, count, slave=self.config['unit_id']
                )
            else:
                logger.error(f"Unknown register type: {reg_type}")
                return None

            if not result.isError():
                if reg_type == 'coil':
                    return result.bits[0]
                else:
                    return result.registers[0]
            else:
                logger.error(f"Error reading {reg_type}:{address} - {result}")
                return None

        except Exception as e:
            logger.error(f"Exception reading {reg_type}:{address} - {e}")
            return None

    def write_coil(self, address, value):
        """Write ke coil (digital output)"""
        try:
            result = self.client.write_coil(address, value, slave=self.config['unit_id'])
            if not result.isError():
                logger.info(f"Written coil {address} = {value}")
                return True
            else:
                logger.error(f"Error writing coil {address}")
                return False
        except Exception as e:
            logger.error(f"Exception writing coil {address}: {e}")
            return False

    def write_register(self, address, value):
        """Write ke holding register"""
        try:
            result = self.client.write_register(address, value, slave=self.config['unit_id'])
            if not result.isError():
                logger.info(f"Written register {address} = {value}")
                return True
            else:
                logger.error(f"Error writing register {address}")
                return False
        except Exception as e:
            logger.error(f"Exception writing register {address}: {e}")
            return False

    def disconnect(self):
        self.client.close()

# ==================== MAIN BRIDGE ====================

class OpenPLCBridge:
    def __init__(self):
        self.modbus = ModbusClient(OPENPLC_CONFIG)
        self.mqtt = MQTTClient(MQTT_CONFIG)
        self.running = False

    def start(self):
        logger.info("Starting OpenPLC to MQTT Bridge...")

        # Connect to MQTT
        if not self.mqtt.connect():
            logger.error("Failed to connect to MQTT broker")
            return False

        # Connect to Modbus
        if not self.modbus.connect():
            logger.error("Failed to connect to OpenPLC")
            return False

        self.running = True
        logger.info("Bridge started successfully")
        return True

    def read_and_publish(self):
        """Read semua registers dan publish ke MQTT"""
        for reg_key, config in REGISTER_MAPPING.items():
            reg_type, address = reg_key.split(':')
            address = int(address)

            # Read dari Modbus
            value = self.modbus.read_register(reg_type, address)

            if value is not None:
                # Apply scale factor
                if reg_type != 'coil':
                    scaled_value = value * config['scale']
                else:
                    scaled_value = bool(value)

                # Prepare payload
                payload = {
                    'value': scaled_value,
                    'unit': config['unit'],
                    'timestamp': int(time.time() * 1000),
                    'source': 'openplc',
                    'register': f"{reg_type}:{address}",
                    'name': config['name']
                }

                # Publish ke MQTT
                if self.mqtt.publish(config['topic'], payload):
                    logger.debug(f"Published {config['name']}: {scaled_value} {config['unit']}")
                else:
                    logger.warning(f"Failed to publish {config['name']}")

    def handle_commands(self):
        """Handle commands dari dashboard (jika ada)"""
        # Implementasi command handling bisa ditambahkan di sini
        # Misalnya: START/STOP machine via write coil
        pass

    def run(self):
        """Main loop"""
        try:
            while self.running:
                # Reconnect jika perlu
                if not self.modbus.client.is_socket_open():
                    logger.warning("Modbus connection lost, reconnecting...")
                    self.modbus.connect()

                # Read dan publish data
                self.read_and_publish()

                # Handle commands (opsional)
                self.handle_commands()

                # Wait for next update
                time.sleep(UPDATE_INTERVAL)

        except KeyboardInterrupt:
            logger.info("Bridge stopped by user")
        except Exception as e:
            logger.error(f"Bridge error: {e}")
        finally:
            self.stop()

    def stop(self):
        """Stop bridge dan cleanup"""
        logger.info("Stopping bridge...")
        self.running = False
        self.modbus.disconnect()
        self.mqtt.disconnect()
        logger.info("Bridge stopped")

# ==================== ENTRY POINT ====================

if __name__ == "__main__":
    print("="*60)
    print("OpenPLC to MQTT Bridge for IIOT Dashboard")
    print("="*60)
    print(f"OpenPLC: {OPENPLC_CONFIG['host']}:{OPENPLC_CONFIG['port']}")
    print(f"MQTT Broker: {MQTT_CONFIG['broker']}:{MQTT_CONFIG['port']}")
    print(f"Update Interval: {UPDATE_INTERVAL}s")
    print("="*60)
    print()

    bridge = OpenPLCBridge()

    if bridge.start():
        bridge.run()
    else:
        logger.error("Failed to start bridge")
