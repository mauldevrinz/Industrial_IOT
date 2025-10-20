#!/usr/bin/env python3
"""
SCADA Database to MQTT Bridge
Membaca data dari SCADA database (MySQL/PostgreSQL) dan publish ke MQTT
untuk ditampilkan di IIOT Dashboard

Cocok untuk: ScadaBR, Ignition, WinCC, dll yang menyimpan data di database

Requirements:
    pip install pymysql paho-mqtt
    # atau untuk PostgreSQL: pip install psycopg2

Author: IIOT Dashboard Team
License: MIT
"""

import pymysql
import paho.mqtt.client as mqtt
import json
import time
import logging
from datetime import datetime, timedelta

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ==================== CONFIGURATION ====================

# Database Configuration (ScadaBR uses MySQL)
DB_CONFIG = {
    'type': 'mysql',  # mysql atau postgresql
    'host': 'localhost',
    'port': 3306,
    'user': 'scada_user',
    'password': 'scada_password',
    'database': 'scadabr',
    'charset': 'utf8mb4'
}

# MQTT Configuration
MQTT_CONFIG = {
    'broker': 'localhost',
    'port': 1883,
    'username': '',
    'password': '',
    'client_id': 'SCADA_DB_Bridge'
}

# Update interval (seconds)
UPDATE_INTERVAL = 10

# Tag Mapping: SCADA tag name -> MQTT topic
TAG_MAPPING = {
    # ScadaBR tag names
    'TEMP_SENSOR_01': 'iiot/sensor/temperature',
    'LEVEL_01': 'iiot/sensor/level',
    'PRESSURE_TRANS_01': 'iiot/sensor/pressure',
    'VIBRATION_SENSOR_01': 'iiot/sensor/vibration',
    'LINE_SPEED': 'iiot/machine/speed',
    'PRODUCTION_COUNT': 'iiot/machine/output',
    'OEE_LINE1': 'iiot/kpi/oee',
    'AVAILABILITY': 'iiot/kpi/availability',
    'PERFORMANCE': 'iiot/kpi/performance',
    'QUALITY': 'iiot/kpi/quality',
}

# ==================== DATABASE CLIENT ====================

class DatabaseClient:
    def __init__(self, config):
        self.config = config
        self.connection = None

    def connect(self):
        """Connect ke database"""
        try:
            if self.config['type'] == 'mysql':
                self.connection = pymysql.connect(
                    host=self.config['host'],
                    port=self.config['port'],
                    user=self.config['user'],
                    password=self.config['password'],
                    database=self.config['database'],
                    charset=self.config['charset'],
                    cursorclass=pymysql.cursors.DictCursor
                )
                logger.info(f"Connected to MySQL database: {self.config['database']}")
                return True

            # Untuk PostgreSQL (uncomment jika perlu)
            # elif self.config['type'] == 'postgresql':
            #     import psycopg2
            #     import psycopg2.extras
            #     self.connection = psycopg2.connect(
            #         host=self.config['host'],
            #         port=self.config['port'],
            #         user=self.config['user'],
            #         password=self.config['password'],
            #         database=self.config['database']
            #     )
            #     logger.info(f"Connected to PostgreSQL database: {self.config['database']}")
            #     return True

            else:
                logger.error(f"Unsupported database type: {self.config['type']}")
                return False

        except Exception as e:
            logger.error(f"Database connection error: {e}")
            return False

    def fetch_latest_values(self, time_window_minutes=5):
        """
        Fetch latest values dari SCADA database
        Query ini untuk ScadaBR schema, sesuaikan dengan SCADA Anda
        """
        if not self.connection:
            return []

        try:
            with self.connection.cursor() as cursor:
                # Query untuk ScadaBR
                # Tabel: dataPoints (metadata), pointValues (data)
                query = """
                    SELECT
                        dp.xid as tag_name,
                        dp.pointName as point_name,
                        pv.pointValue as value,
                        pv.ts as timestamp,
                        dp.engineeringUnits as unit
                    FROM pointValues pv
                    JOIN dataPoints dp ON pv.dataPointId = dp.id
                    WHERE pv.ts > %s
                    ORDER BY pv.ts DESC
                """

                # Get data dari 5 menit terakhir
                time_threshold = int((time.time() - time_window_minutes * 60) * 1000)

                cursor.execute(query, (time_threshold,))
                results = cursor.fetchall()

                logger.debug(f"Fetched {len(results)} records from database")
                return results

        except Exception as e:
            logger.error(f"Error fetching data: {e}")
            return []

    def fetch_latest_by_tag(self):
        """
        Fetch hanya nilai terakhir untuk setiap tag
        Lebih efisien untuk real-time monitoring
        """
        if not self.connection:
            return {}

        try:
            with self.connection.cursor() as cursor:
                # Query untuk get latest value per tag
                query = """
                    SELECT
                        dp.xid as tag_name,
                        dp.pointName as point_name,
                        pv.pointValue as value,
                        pv.ts as timestamp,
                        dp.engineeringUnits as unit
                    FROM dataPoints dp
                    LEFT JOIN pointValues pv ON (
                        pv.dataPointId = dp.id
                        AND pv.ts = (
                            SELECT MAX(ts)
                            FROM pointValues
                            WHERE dataPointId = dp.id
                        )
                    )
                    WHERE dp.xid IN %s
                """

                # Get hanya tags yang di-map
                tags = tuple(TAG_MAPPING.keys())

                cursor.execute(query, (tags,))
                results = cursor.fetchall()

                # Convert ke dictionary
                data = {}
                for row in results:
                    data[row['tag_name']] = {
                        'value': row['value'],
                        'timestamp': row['timestamp'],
                        'unit': row['unit'],
                        'name': row['point_name']
                    }

                return data

        except Exception as e:
            logger.error(f"Error fetching latest data: {e}")
            return {}

    def disconnect(self):
        if self.connection:
            self.connection.close()
            logger.info("Database connection closed")

# ==================== MQTT CLIENT ====================

class MQTTClient:
    def __init__(self, config):
        self.config = config
        self.client = mqtt.Client(config['client_id'])

        if config['username']:
            self.client.username_pw_set(config['username'], config['password'])

        self.client.on_connect = self.on_connect
        self.connected = False

    def on_connect(self, client, userdata, flags, rc):
        if rc == 0:
            logger.info("MQTT Connected")
            self.connected = True
        else:
            logger.error(f"MQTT Connection failed with code {rc}")

    def connect(self):
        try:
            self.client.connect(self.config['broker'], self.config['port'])
            self.client.loop_start()
            time.sleep(2)
            return self.connected
        except Exception as e:
            logger.error(f"MQTT Connection error: {e}")
            return False

    def publish(self, topic, payload):
        if self.connected:
            result = self.client.publish(topic, json.dumps(payload), qos=1)
            return result.rc == mqtt.MQTT_ERR_SUCCESS
        return False

    def disconnect(self):
        self.client.loop_stop()
        self.client.disconnect()

# ==================== MAIN BRIDGE ====================

class SCADABridge:
    def __init__(self):
        self.db = DatabaseClient(DB_CONFIG)
        self.mqtt = MQTTClient(MQTT_CONFIG)
        self.running = False
        self.last_values = {}  # Cache untuk detect changes

    def start(self):
        logger.info("Starting SCADA Database to MQTT Bridge...")

        # Connect to MQTT
        if not self.mqtt.connect():
            logger.error("Failed to connect to MQTT broker")
            return False

        # Connect to Database
        if not self.db.connect():
            logger.error("Failed to connect to SCADA database")
            return False

        self.running = True
        logger.info("Bridge started successfully")
        return True

    def process_and_publish(self):
        """Fetch data dari database dan publish ke MQTT"""

        # Fetch latest values per tag
        data = self.db.fetch_latest_by_tag()

        if not data:
            logger.warning("No data fetched from database")
            return

        # Process setiap tag
        for tag_name, tag_data in data.items():
            # Check jika tag ada di mapping
            if tag_name not in TAG_MAPPING:
                continue

            # Get MQTT topic
            topic = TAG_MAPPING[tag_name]

            # Check jika nilai berubah (optional optimization)
            if tag_name in self.last_values:
                if self.last_values[tag_name] == tag_data['value']:
                    continue  # Skip jika nilai sama

            # Update cache
            self.last_values[tag_name] = tag_data['value']

            # Prepare payload
            payload = {
                'value': tag_data['value'],
                'unit': tag_data['unit'],
                'timestamp': tag_data['timestamp'],
                'source': 'scada_db',
                'tag_name': tag_name,
                'point_name': tag_data['name']
            }

            # Publish ke MQTT
            if self.mqtt.publish(topic, payload):
                logger.info(f"Published {tag_name}: {tag_data['value']} {tag_data['unit']} -> {topic}")
            else:
                logger.warning(f"Failed to publish {tag_name}")

    def run(self):
        """Main loop"""
        try:
            while self.running:
                # Process data
                self.process_and_publish()

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
        self.db.disconnect()
        self.mqtt.disconnect()
        logger.info("Bridge stopped")

# ==================== ENTRY POINT ====================

if __name__ == "__main__":
    print("="*60)
    print("SCADA Database to MQTT Bridge for IIOT Dashboard")
    print("="*60)
    print(f"Database: {DB_CONFIG['type']} at {DB_CONFIG['host']}:{DB_CONFIG['port']}")
    print(f"MQTT Broker: {MQTT_CONFIG['broker']}:{MQTT_CONFIG['port']}")
    print(f"Update Interval: {UPDATE_INTERVAL}s")
    print(f"Monitoring {len(TAG_MAPPING)} tags")
    print("="*60)
    print()

    bridge = SCADABridge()

    if bridge.start():
        bridge.run()
    else:
        logger.error("Failed to start bridge")
