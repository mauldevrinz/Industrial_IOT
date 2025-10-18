# Panduan Integrasi IIOT Dashboard

Dashboard IIOT ini dapat diintegrasikan dengan berbagai sistem kontrol industri melalui protokol MQTT. Berikut panduan lengkap untuk integrasi dengan SCADA dan OpenPLC.

## 📊 Arsitektur Integrasi

```
┌─────────────┐      MQTT      ┌──────────────┐      MQTT      ┌─────────────┐
│   OpenPLC   │ ──────────────> │ MQTT Broker  │ ──────────────> │  Dashboard  │
└─────────────┘                 │  (Mosquitto) │                 │   (React)   │
                                └──────────────┘                 └─────────────┘
                                       ↑
                                       │ MQTT
                                       │
                                ┌──────────────┐
                                │    SCADA     │
                                │  (ScadaBR,   │
                                │   Ignition)  │
                                └──────────────┘
```

## 1. Integrasi dengan SCADA

### Sistem SCADA yang Didukung

1. **ScadaBR** (Open Source)
2. **Ignition by Inductive Automation**
3. **WinCC** (Siemens)
4. **Wonderware System Platform**
5. **AVEVA Edge** (formerly InduSoft)

### Metode Integrasi

#### A. Melalui MQTT Bridge

SCADA systems biasanya mendukung beberapa protokol. Berikut cara integrasinya:

**1. ScadaBR dengan MQTT Publisher**

```javascript
// Script di ScadaBR untuk publish ke MQTT
// File: scadabr_mqtt_publisher.js

var mqtt = require('mqtt');
var client = mqtt.connect('mqtt://localhost:1883');

// Function untuk publish data dari SCADA ke Dashboard
function publishToMQTT(tag, value) {
    var topic = 'iiot/scada/' + tag;
    var payload = JSON.stringify({
        value: value,
        timestamp: Date.now(),
        source: 'scadabr'
    });

    client.publish(topic, payload);
}

// Contoh: Publish temperature dari SCADA tag
publishToMQTT('temperature', getTagValue('TEMP_01'));
publishToMQTT('pressure', getTagValue('PRESSURE_01'));
```

**2. Ignition dengan MQTT Engine Module**

Ignition memiliki MQTT Engine module built-in:

```python
# Script di Ignition Gateway
# Path: Gateway > Scripts > Project Library

import system.mqtt

def publishToDashboard(tagPath, topic):
    # Read tag value dari Ignition
    value = system.tag.readBlocking([tagPath])[0].value

    # Format JSON
    payload = {
        'value': value,
        'timestamp': system.date.now().getTime(),
        'source': 'ignition',
        'tag': tagPath
    }

    # Publish ke MQTT
    system.mqtt.publish(
        'MQTT Engine',  # MQTT Engine name
        topic,
        system.util.jsonEncode(payload),
        1,  # QoS
        False  # Retain
    )

# Contoh penggunaan
publishToDashboard('[default]Line1/Temperature', 'iiot/sensor/temperature')
publishToDashboard('[default]Line1/Speed', 'iiot/machine/speed')
```

**3. WinCC (Siemens) dengan OPC UA ke MQTT**

```python
# Python bridge untuk WinCC OPC UA ke MQTT
# File: wincc_mqtt_bridge.py

from opcua import Client
import paho.mqtt.client as mqtt
import json
import time

# OPC UA Configuration
opcua_url = "opc.tcp://localhost:4840"
opcua_client = Client(opcua_url)

# MQTT Configuration
mqtt_broker = "localhost"
mqtt_port = 1883
mqtt_client = mqtt.Client("WinCC_Bridge")

# Connect ke OPC UA
opcua_client.connect()
print("Connected to WinCC OPC UA Server")

# Connect ke MQTT
mqtt_client.connect(mqtt_broker, mqtt_port)
mqtt_client.loop_start()

# Mapping OPC UA nodes ke MQTT topics
tag_mapping = {
    'ns=2;s=Temperature_PLC1': 'iiot/sensor/temperature',
    'ns=2;s=Pressure_PLC1': 'iiot/sensor/pressure',
    'ns=2;s=Speed_Machine1': 'iiot/machine/speed',
    'ns=2;s=OEE_Line1': 'iiot/kpi/oee',
}

def publish_opcua_to_mqtt():
    while True:
        for node_id, topic in tag_mapping.items():
            try:
                # Read dari OPC UA
                node = opcua_client.get_node(node_id)
                value = node.get_value()

                # Format payload
                payload = json.dumps({
                    'value': float(value),
                    'timestamp': int(time.time() * 1000),
                    'source': 'wincc',
                    'node_id': node_id
                })

                # Publish ke MQTT
                mqtt_client.publish(topic, payload)
                print(f"Published {node_id} -> {topic}: {value}")

            except Exception as e:
                print(f"Error reading {node_id}: {e}")

        time.sleep(5)  # Update setiap 5 detik

if __name__ == "__main__":
    try:
        publish_opcua_to_mqtt()
    except KeyboardInterrupt:
        opcua_client.disconnect()
        mqtt_client.loop_stop()
        print("Bridge stopped")
```

#### B. Database Integration

Jika SCADA menggunakan database (SQL Server, MySQL, PostgreSQL):

```python
# File: scada_db_mqtt_bridge.py

import pymysql
import paho.mqtt.client as mqtt
import json
import time

# Database Configuration (ScadaBR biasanya pakai MySQL)
db_config = {
    'host': 'localhost',
    'user': 'scada_user',
    'password': 'scada_password',
    'database': 'scadabr',
    'charset': 'utf8mb4'
}

# MQTT Configuration
mqtt_client = mqtt.Client("SCADA_DB_Bridge")
mqtt_client.connect("localhost", 1883)
mqtt_client.loop_start()

def fetch_and_publish_data():
    connection = pymysql.connect(**db_config)

    try:
        with connection.cursor() as cursor:
            # Query latest values dari SCADA database
            sql = """
                SELECT
                    dp.xid as tag_name,
                    pv.pointValue as value,
                    pv.ts as timestamp
                FROM pointValues pv
                JOIN dataPoints dp ON pv.dataPointId = dp.id
                WHERE pv.ts > (UNIX_TIMESTAMP() - 60) * 1000
                ORDER BY pv.ts DESC
            """
            cursor.execute(sql)
            results = cursor.fetchall()

            # Publish setiap data point ke MQTT
            for row in results:
                tag_name = row[0]
                value = row[1]
                timestamp = row[2]

                # Map tag name ke topic
                topic = f'iiot/scada/{tag_name}'

                payload = json.dumps({
                    'value': value,
                    'timestamp': timestamp,
                    'source': 'scada_db'
                })

                mqtt_client.publish(topic, payload)
                print(f"Published {tag_name}: {value}")

    finally:
        connection.close()

# Run setiap 5 detik
while True:
    try:
        fetch_and_publish_data()
        time.sleep(5)
    except Exception as e:
        print(f"Error: {e}")
        time.sleep(10)
```

---

## 2. Integrasi dengan OpenPLC

OpenPLC adalah platform PLC open-source yang sangat cocok untuk IIOT.

### Metode Integrasi

#### A. OpenPLC dengan Modbus TCP ke MQTT

```python
# File: openplc_mqtt_bridge.py

from pymodbus.client import ModbusTcpClient
import paho.mqtt.client as mqtt
import json
import time

# OpenPLC Configuration (default)
OPENPLC_IP = "192.168.1.10"
OPENPLC_PORT = 502

# MQTT Configuration
MQTT_BROKER = "localhost"
MQTT_PORT = 1883

# Initialize Modbus Client
modbus_client = ModbusTcpClient(OPENPLC_IP, port=OPENPLC_PORT)

# Initialize MQTT Client
mqtt_client = mqtt.Client("OpenPLC_Bridge")
mqtt_client.connect(MQTT_BROKER, MQTT_PORT)
mqtt_client.loop_start()

# Mapping Modbus registers ke MQTT topics
# Format: (register_type, address, count, topic, unit)
register_mapping = [
    # Holding Registers (Read/Write) - untuk sensor values
    ('holding', 0, 1, 'iiot/sensor/temperature', '°C'),
    ('holding', 1, 1, 'iiot/sensor/humidity', '%'),
    ('holding', 2, 1, 'iiot/sensor/pressure', 'bar'),
    ('holding', 3, 1, 'iiot/sensor/vibration', 'mm/s'),

    # Input Registers (Read Only) - untuk machine status
    ('input', 0, 1, 'iiot/machine/speed', 'rpm'),
    ('input', 1, 1, 'iiot/machine/output', 'units'),

    # Coils (Digital Outputs)
    ('coil', 0, 1, 'iiot/machine/status', None),
]

def read_openplc_data():
    """Read data dari OpenPLC via Modbus"""
    data_points = []

    for reg_type, address, count, topic, unit in register_mapping:
        try:
            if reg_type == 'holding':
                result = modbus_client.read_holding_registers(address, count)
            elif reg_type == 'input':
                result = modbus_client.read_input_registers(address, count)
            elif reg_type == 'coil':
                result = modbus_client.read_coils(address, count)
            else:
                continue

            if not result.isError():
                if reg_type == 'coil':
                    value = result.bits[0]
                else:
                    value = result.registers[0] / 10.0  # Scale factor

                data_points.append({
                    'topic': topic,
                    'value': value,
                    'unit': unit,
                    'address': address,
                    'type': reg_type
                })
            else:
                print(f"Error reading {reg_type} register {address}")

        except Exception as e:
            print(f"Error reading {reg_type}:{address} - {e}")

    return data_points

def publish_to_mqtt(data_points):
    """Publish data ke MQTT broker"""
    for dp in data_points:
        payload = {
            'value': dp['value'],
            'unit': dp['unit'],
            'timestamp': int(time.time() * 1000),
            'source': 'openplc',
            'register': f"{dp['type']}:{dp['address']}"
        }

        mqtt_client.publish(dp['topic'], json.dumps(payload))
        print(f"Published {dp['topic']}: {dp['value']} {dp['unit']}")

def mqtt_callback(client, userdata, message):
    """Handle commands dari dashboard"""
    topic = message.topic
    payload = json.loads(message.payload)

    # Contoh: Control machine via MQTT
    if topic == 'iiot/command':
        command = payload.get('command')

        if command == 'START':
            # Write ke coil untuk start machine
            modbus_client.write_coil(0, True)
            print("Machine started")
        elif command == 'STOP':
            # Write ke coil untuk stop machine
            modbus_client.write_coil(0, False)
            print("Machine stopped")

# Subscribe ke command topics
mqtt_client.subscribe('iiot/command')
mqtt_client.subscribe('iiot/control')
mqtt_client.on_message = mqtt_callback

# Main loop
print("OpenPLC to MQTT Bridge Started")
print(f"Connecting to OpenPLC at {OPENPLC_IP}:{OPENPLC_PORT}")
print(f"Publishing to MQTT broker at {MQTT_BROKER}:{MQTT_PORT}")

try:
    while True:
        if modbus_client.connect():
            # Read data dari OpenPLC
            data = read_openplc_data()

            # Publish ke MQTT
            publish_to_mqtt(data)

            modbus_client.close()
        else:
            print("Failed to connect to OpenPLC")

        time.sleep(5)  # Update interval 5 detik

except KeyboardInterrupt:
    print("\nBridge stopped")
    mqtt_client.loop_stop()
    modbus_client.close()
```

#### B. OpenPLC Runtime Script (Direct MQTT)

Jika anda ingin langsung dari OpenPLC Runtime:

```python
# File: openplc_direct_mqtt.py
# Install di OpenPLC Runtime: Hardware Layer

import paho.mqtt.client as mqtt
import json
import time

# Global variables untuk komunikasi dengan PLC
mqtt_client = None

def hardware_init():
    """Initialize MQTT client"""
    global mqtt_client

    mqtt_client = mqtt.Client("OpenPLC_Direct")
    mqtt_client.connect("localhost", 1883)
    mqtt_client.loop_start()

    # Subscribe untuk menerima commands
    mqtt_client.subscribe("iiot/command")
    mqtt_client.subscribe("iiot/control")
    mqtt_client.on_message = on_mqtt_message

    print("OpenPLC MQTT Hardware Layer initialized")
    return 0

def update_inputs(inputs):
    """Update PLC inputs dari MQTT jika ada"""
    # Inputs akan di-update dari MQTT callback
    pass

def update_outputs(outputs):
    """Publish PLC outputs ke MQTT"""
    if mqtt_client is None:
        return

    try:
        # Mapping outputs ke topics
        topics_map = {
            0: 'iiot/sensor/temperature',
            1: 'iiot/sensor/humidity',
            2: 'iiot/sensor/pressure',
            3: 'iiot/sensor/vibration',
        }

        for idx, topic in topics_map.items():
            if idx < len(outputs):
                value = outputs[idx] / 10.0  # Scale

                payload = json.dumps({
                    'value': value,
                    'timestamp': int(time.time() * 1000),
                    'source': 'openplc_runtime'
                })

                mqtt_client.publish(topic, payload)

    except Exception as e:
        print(f"Error publishing outputs: {e}")

def on_mqtt_message(client, userdata, message):
    """Handle incoming MQTT messages"""
    try:
        payload = json.loads(message.payload)
        command = payload.get('command')

        # Update PLC variables berdasarkan command
        # Ini akan mempengaruhi ladder logic
        print(f"Received command: {command}")

    except Exception as e:
        print(f"Error handling MQTT message: {e}")

def hardware_cleanup():
    """Cleanup saat shutdown"""
    global mqtt_client
    if mqtt_client:
        mqtt_client.loop_stop()
        mqtt_client.disconnect()
```

---

## 3. Konfigurasi MQTT Broker Bridge

Untuk menghubungkan multiple MQTT brokers (misalnya SCADA punya broker sendiri):

```conf
# File: /etc/mosquitto/conf.d/bridge.conf

# Bridge ke SCADA MQTT Broker
connection bridge-to-scada
address scada-broker.local:1883
topic iiot/scada/# both 2
topic iiot/command out 2
topic iiot/control out 2
cleansession false
notifications true
try_private true

# Bridge ke OpenPLC MQTT Broker (jika ada)
connection bridge-to-openplc
address openplc-broker.local:1883
topic iiot/plc/# both 2
topic iiot/command out 2
cleansession false
```

---

## 4. Data Mapping Configuration

Buat file konfigurasi untuk mapping data:

```javascript
// File: src/config/integration.config.js

export const integrationConfig = {
  // SCADA Data Mapping
  scada: {
    enabled: true,
    broker: 'mqtt://scada-broker.local:1883',
    topicPrefix: 'iiot/scada/',

    // Mapping SCADA tags ke dashboard metrics
    tagMapping: {
      'TEMP_SENSOR_01': 'iiot/sensor/temperature',
      'HUMIDITY_01': 'iiot/sensor/humidity',
      'PRESSURE_TRANS_01': 'iiot/sensor/pressure',
      'VIBRATION_SENSOR_01': 'iiot/sensor/vibration',
      'LINE_SPEED': 'iiot/machine/speed',
      'PROD_COUNT': 'iiot/machine/output',
    }
  },

  // OpenPLC Data Mapping
  openplc: {
    enabled: true,
    modbusIP: '192.168.1.10',
    modbusPort: 502,

    // Mapping Modbus registers
    registers: {
      temperature: { type: 'holding', address: 0, scale: 0.1 },
      humidity: { type: 'holding', address: 1, scale: 0.1 },
      pressure: { type: 'holding', address: 2, scale: 0.01 },
      vibration: { type: 'holding', address: 3, scale: 0.1 },
      machineSpeed: { type: 'input', address: 0, scale: 1 },
      machineStatus: { type: 'coil', address: 0, scale: 1 },
    }
  },

  // OPC UA Configuration (untuk WinCC, dll)
  opcua: {
    enabled: false,
    endpoint: 'opc.tcp://localhost:4840',

    nodeMapping: {
      'ns=2;s=Temperature': 'iiot/sensor/temperature',
      'ns=2;s=Humidity': 'iiot/sensor/humidity',
    }
  }
};

export default integrationConfig;
```

---

## 5. Testing Integration

### Test Script untuk SCADA

```bash
#!/bin/bash
# File: test_scada_integration.sh

echo "Testing SCADA to MQTT Integration..."

# Publish test data dari SCADA simulator
mosquitto_pub -h localhost -t "iiot/scada/temperature" -m '{"value": 25.5, "timestamp": 1234567890, "source": "scada_test"}'
mosquitto_pub -h localhost -t "iiot/scada/humidity" -m '{"value": 45.0, "timestamp": 1234567890, "source": "scada_test"}'

echo "Test data published. Check dashboard for updates."

# Subscribe untuk verify
mosquitto_sub -h localhost -t "iiot/#" -v
```

### Test Script untuk OpenPLC

```python
# File: test_openplc.py

from pymodbus.client import ModbusTcpClient

client = ModbusTcpClient('192.168.1.10', port=502)

if client.connect():
    print("Connected to OpenPLC")

    # Write test values
    client.write_register(0, 255)  # Temperature = 25.5°C (scale 0.1)
    client.write_register(1, 450)  # Humidity = 45%
    client.write_coil(0, True)     # Machine ON

    print("Test values written to OpenPLC")

    # Read back
    temp = client.read_holding_registers(0, 1)
    print(f"Temperature: {temp.registers[0] / 10.0}°C")

    client.close()
else:
    print("Failed to connect to OpenPLC")
```

---

## 6. Troubleshooting

### Common Issues

1. **MQTT Connection Failed**
   ```bash
   # Check mosquitto status
   sudo systemctl status mosquitto

   # Check mosquitto logs
   sudo tail -f /var/log/mosquitto/mosquitto.log

   # Test MQTT connection
   mosquitto_sub -h localhost -t "iiot/#" -v
   ```

2. **OpenPLC Modbus Not Responding**
   ```bash
   # Test Modbus connection
   sudo apt-get install mbpoll
   mbpoll -a 1 -r 0 -c 10 192.168.1.10
   ```

3. **SCADA Database Connection Error**
   ```bash
   # Test database connection
   mysql -h localhost -u scada_user -p -e "SHOW DATABASES;"
   ```

---

## 7. Security Best Practices

1. **MQTT Authentication**
   ```conf
   # /etc/mosquitto/conf.d/auth.conf
   allow_anonymous false
   password_file /etc/mosquitto/passwd
   ```

2. **SSL/TLS Encryption**
   ```conf
   # /etc/mosquitto/conf.d/ssl.conf
   listener 8883
   cafile /etc/mosquitto/certs/ca.crt
   certfile /etc/mosquitto/certs/server.crt
   keyfile /etc/mosquitto/certs/server.key
   ```

3. **Firewall Configuration**
   ```bash
   sudo ufw allow 1883/tcp  # MQTT
   sudo ufw allow 8883/tcp  # MQTT SSL
   sudo ufw allow 502/tcp   # Modbus TCP
   ```

---

## Resources

- [OpenPLC Official Documentation](https://openplcproject.com)
- [ScadaBR Documentation](http://www.scadabr.com.br)
- [Ignition MQTT Engine](https://inductiveautomation.com/ignition/modules/mqtt-engine)
- [Mosquitto MQTT Broker](https://mosquitto.org/documentation/)
- [Node-RED for Industrial IoT](https://nodered.org)

---

**Catatan**: Pastikan semua sistem berada di network yang sama atau terhubung melalui VPN untuk keamanan.
