# IIOT Dashboard - Industrial IoT KPI Dashboard

A modern, real-time Industrial IoT dashboard built with React and integrated with ESP32 microcontrollers via MQTT protocol.

## Features

- **Real-time Monitoring**: Live sensor data visualization from ESP32 devices
- **KPI Dashboard**: Track Overall Equipment Effectiveness (OEE), Availability, Performance, and Quality metrics
- **Maintenance Management**: Schedule and track equipment maintenance
- **Data Analytics**: Historical data with interactive charts and export capabilities
- **MQTT Integration**: Seamless communication with ESP32 microPLC devices

## Technology Stack

- **Frontend**: React 18 + Vite
- **Styling**: Tailwind CSS
- **Charts**: Recharts + React Circular Progressbar
- **Communication**: MQTT.js
- **Routing**: React Router DOM
- **Icons**: Lucide React

## Prerequisites

- Node.js 16+ and npm
- MQTT Broker (e.g., Mosquitto, HiveMQ, or EMQX)
- ESP32 microcontroller with MQTT support

## Installation

1. Clone or download this repository:
```bash
cd IIOT
```

2. Install dependencies:
```bash
npm install
```

3. Configure MQTT settings:
Edit `src/config/mqtt.config.js` with your MQTT broker details:
```javascript
broker: {
  host: 'your-mqtt-broker.com',
  port: 8883,
  protocol: 'wss',
}
```

4. Start the development server:
```bash
npm run dev
```

5. Open your browser and navigate to `http://localhost:5173`

## MQTT Configuration

### Broker Setup

For local development, install Mosquitto:

**Ubuntu/Debian:**
```bash
sudo apt-get install mosquitto mosquitto-clients
sudo systemctl enable mosquitto
sudo systemctl start mosquitto
```

**macOS:**
```bash
brew install mosquitto
brew services start mosquitto
```

**Windows:**
Download from [mosquitto.org](https://mosquitto.org/download/)

### Enable WebSocket Support

Edit `/etc/mosquitto/mosquitto.conf`:
```
listener 1883
protocol mqtt

listener 8080
protocol websockets
```

Restart Mosquitto:
```bash
sudo systemctl restart mosquitto
```

## ESP32 Integration

### Required Libraries

Install these libraries in Arduino IDE:
- PubSubClient (for MQTT)
- ArduinoJson (for JSON formatting)
- WiFi (built-in)

### Example ESP32 Code

```cpp
#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

// WiFi credentials
const char* ssid = "your-wifi-ssid";
const char* password = "your-wifi-password";

// MQTT Broker settings
const char* mqtt_server = "your-mqtt-broker-ip";
const int mqtt_port = 1883;
const char* mqtt_user = "your-username";  // Optional
const char* mqtt_password = "your-password";  // Optional

WiFiClient espClient;
PubSubClient client(espClient);

// Sensor pins
const int tempSensorPin = 34;
const int humiditySensorPin = 35;

void setup() {
  Serial.begin(115200);

  // Connect to WiFi
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected");

  // Setup MQTT
  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(callback);
}

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();

  // Publish sensor data every 5 seconds
  static unsigned long lastMsg = 0;
  unsigned long now = millis();
  if (now - lastMsg > 5000) {
    lastMsg = now;
    publishSensorData();
  }
}

void reconnect() {
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");
    String clientId = "ESP32Client-" + String(random(0xffff), HEX);

    if (client.connect(clientId.c_str(), mqtt_user, mqtt_password)) {
      Serial.println("connected");
      // Subscribe to command topic
      client.subscribe("iiot/command");
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      delay(5000);
    }
  }
}

void publishSensorData() {
  StaticJsonDocument<200> doc;

  // Read temperature sensor (example)
  float temperature = readTemperature();
  doc["value"] = temperature;
  doc["unit"] = "°C";
  doc["timestamp"] = millis();

  char buffer[256];
  serializeJson(doc, buffer);

  client.publish("iiot/sensor/temperature", buffer);

  // Publish other sensors
  publishHumidity();
  publishKPI();
}

float readTemperature() {
  // Replace with actual sensor reading
  int rawValue = analogRead(tempSensorPin);
  float voltage = rawValue * (3.3 / 4095.0);
  float temperature = (voltage - 0.5) * 100.0; // Example conversion
  return temperature;
}

void publishHumidity() {
  StaticJsonDocument<200> doc;

  // Read humidity sensor
  float humidity = 45.5; // Replace with actual reading
  doc["value"] = humidity;
  doc["unit"] = "%";
  doc["timestamp"] = millis();

  char buffer[256];
  serializeJson(doc, buffer);
  client.publish("iiot/sensor/humidity", buffer);
}

void publishKPI() {
  StaticJsonDocument<200> doc;

  // Calculate OEE (example)
  float oee = 85.5;
  doc["value"] = oee;
  doc["timestamp"] = millis();

  char buffer[256];
  serializeJson(doc, buffer);
  client.publish("iiot/kpi/oee", buffer);
}

void callback(char* topic, byte* payload, unsigned int length) {
  Serial.print("Message arrived [");
  Serial.print(topic);
  Serial.print("] ");

  String message;
  for (int i = 0; i < length; i++) {
    message += (char)payload[i];
  }
  Serial.println(message);

  // Handle commands from dashboard
  if (String(topic) == "iiot/command") {
    handleCommand(message);
  }
}

void handleCommand(String command) {
  // Implement your command handling logic
  if (command == "START") {
    // Start machine
  } else if (command == "STOP") {
    // Stop machine
  }
}
```

## MQTT Topics

The dashboard subscribes to the following topics:

### Sensor Data
- `iiot/sensor/temperature` - Temperature readings
- `iiot/sensor/humidity` - Humidity readings
- `iiot/sensor/pressure` - Pressure readings
- `iiot/sensor/vibration` - Vibration readings

### Machine Status
- `iiot/machine/status` - Machine operational status
- `iiot/machine/speed` - Current machine speed
- `iiot/machine/output` - Production output

### KPI Metrics
- `iiot/kpi/oee` - Overall Equipment Effectiveness
- `iiot/kpi/availability` - Machine availability
- `iiot/kpi/performance` - Performance efficiency
- `iiot/kpi/quality` - Quality metrics

### Maintenance
- `iiot/maintenance/alert` - Maintenance alerts
- `iiot/maintenance/schedule` - Maintenance schedules

### Control
- `iiot/command` - Commands to ESP32
- `iiot/control` - Control signals

## Message Format

All MQTT messages should be in JSON format:

```json
{
  "value": 25.5,
  "unit": "°C",
  "timestamp": 1634567890,
  "trend": 2.5
}
```

## Project Structure

```
IIOT/
├── src/
│   ├── components/
│   │   ├── dashboard/
│   │   │   ├── Overview.jsx       # Main dashboard overview
│   │   │   ├── Data.jsx           # Sensor data visualization
│   │   │   ├── KPI.jsx            # KPI metrics display
│   │   │   ├── Maintenance.jsx    # Maintenance management
│   │   │   └── Settings.jsx       # Configuration settings
│   │   └── Sidebar.jsx            # Navigation sidebar
│   ├── config/
│   │   └── mqtt.config.js         # MQTT configuration
│   ├── hooks/
│   │   ├── useMQTT.js             # MQTT connection hook
│   │   └── useSensorData.js       # Sensor data management
│   ├── services/
│   │   └── mqttService.js         # MQTT service layer
│   ├── App.jsx                    # Main application
│   └── main.jsx                   # Application entry
├── package.json
└── README.md
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Troubleshooting

### MQTT Connection Issues

1. **Check broker is running:**
   ```bash
   sudo systemctl status mosquitto
   ```

2. **Test MQTT connection:**
   ```bash
   mosquitto_sub -h localhost -t "iiot/#" -v
   ```

3. **Verify WebSocket port is open:**
   ```bash
   netstat -an | grep 8080
   ```

### ESP32 Connection Issues

1. Check WiFi credentials are correct
2. Verify MQTT broker IP address
3. Ensure firewall allows MQTT port (1883 or 8883)
4. Check ESP32 serial monitor for error messages

## Customization

### Adding New Sensors

1. Add topic to `src/config/mqtt.config.js`:
```javascript
topics: {
  newSensor: 'iiot/sensor/newsensor',
}
```

2. Create hook in `src/hooks/useSensorData.js`

3. Add visualization component

### Changing Dashboard Theme

Edit Tailwind configuration in `tailwind.config.js`:
```javascript
theme: {
  extend: {
    colors: {
      primary: '#your-color',
    }
  }
}
```

## Production Deployment

1. Build the application:
```bash
npm run build
```

2. Deploy the `dist` folder to your web server

3. Configure MQTT broker for production with SSL/TLS

4. Update MQTT config to use secure WebSocket (wss://)

## Security Considerations

- Use SSL/TLS for MQTT connections in production
- Implement authentication for MQTT broker
- Use environment variables for sensitive configuration
- Enable CORS properly on MQTT broker
- Implement rate limiting on MQTT topics

## License

MIT

## Support

For issues and questions, please create an issue in the repository.

## Acknowledgments

- Built with React and Vite
- MQTT implementation using MQTT.js
- Charts powered by Recharts
- Icons by Lucide
