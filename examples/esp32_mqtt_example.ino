/*
 * ESP32 MQTT Example for IIOT Dashboard
 *
 * This example demonstrates how to connect an ESP32 to the IIOT Dashboard
 * using MQTT protocol. It publishes sensor data and receives commands.
 *
 * Required Libraries:
 * - PubSubClient by Nick O'Leary
 * - ArduinoJson by Benoit Blanchon
 *
 * Author: IIOT Dashboard Team
 * License: MIT
 */

#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

// ========== WiFi Configuration ==========
const char* ssid = "blink";
const char* password = "blink123";

// ========== MQTT Configuration ==========
const char* mqtt_server = "192.168.1.100";  // Your MQTT broker IP
const int mqtt_port = 1883;
const char* mqtt_user = "";  // Leave empty if no authentication
const char* mqtt_password = "";  // Leave empty if no authentication
const char* device_id = "ESP32_001";  // Unique device identifier

// ========== MQTT Topics ==========
const char* topic_temperature = "iiot/sensor/temperature";
const char* topic_level = "iiot/sensor/level";
const char* topic_pressure = "iiot/sensor/pressure";
const char* topic_vibration = "iiot/sensor/vibration";
const char* topic_machine_status = "iiot/machine/status";
const char* topic_oee = "iiot/kpi/oee";
const char* topic_availability = "iiot/kpi/availability";
const char* topic_performance = "iiot/kpi/performance";
const char* topic_quality = "iiot/kpi/quality";
const char* topic_maintenance_alert = "iiot/maintenance/alert";
const char* topic_command = "iiot/command";

// ========== Pin Configuration ==========
const int LED_PIN = 2;  // Built-in LED
const int TEMP_SENSOR_PIN = 34;
const int LEVEL_SENSOR_PIN = 35;
const int PRESSURE_SENSOR_PIN = 32;
const int VIBRATION_SENSOR_PIN = 33;

// ========== Global Variables ==========
WiFiClient espClient;
PubSubClient client(espClient);
unsigned long lastPublish = 0;
const long publishInterval = 5000;  // Publish every 5 seconds

bool machineRunning = false;
float baseTemperature = 25.0;
float baseLevel = 45.0;

// ========== Function Prototypes ==========
void setup_wifi();
void reconnect_mqtt();
void callback(char* topic, byte* payload, unsigned int length);
void publishSensorData();
void publishTemperature();
void publishLevel();
void publishPressure();
void publishVibration();
void publishMachineStatus();
void publishKPI();
void publishMaintenanceAlert(String message, String severity);
float readTemperature();
float readLevel();
float readPressure();
float readVibration();

// ========== Setup Function ==========
void setup() {
  Serial.begin(115200);
  Serial.println("\n\n=== ESP32 IIOT Dashboard Example ===");

  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);

  // Connect to WiFi
  setup_wifi();

  // Setup MQTT
  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(callback);

  Serial.println("Setup complete!");
}

// ========== Main Loop ==========
void loop() {
  // Ensure MQTT connection
  if (!client.connected()) {
    reconnect_mqtt();
  }
  client.loop();

  // Publish sensor data periodically
  unsigned long now = millis();
  if (now - lastPublish >= publishInterval) {
    lastPublish = now;
    publishSensorData();
  }
}

// ========== WiFi Setup ==========
void setup_wifi() {
  delay(10);
  Serial.print("Connecting to WiFi: ");
  Serial.println(ssid);

  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi connected!");
    Serial.print("IP address: ");
    Serial.println(WiFi.localIP());
    Serial.print("Signal strength (RSSI): ");
    Serial.print(WiFi.RSSI());
    Serial.println(" dBm");
  } else {
    Serial.println("\nWiFi connection failed!");
  }
}

// ========== MQTT Reconnect ==========
void reconnect_mqtt() {
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");

    // Generate unique client ID
    String clientId = "ESP32-";
    clientId += device_id;
    clientId += "-";
    clientId += String(random(0xffff), HEX);

    // Attempt to connect
    bool connected;
    if (strlen(mqtt_user) > 0) {
      connected = client.connect(clientId.c_str(), mqtt_user, mqtt_password);
    } else {
      connected = client.connect(clientId.c_str());
    }

    if (connected) {
      Serial.println("connected!");
      digitalWrite(LED_PIN, HIGH);

      // Subscribe to command topic
      client.subscribe(topic_command);
      Serial.print("Subscribed to: ");
      Serial.println(topic_command);

      // Send initial status
      publishMachineStatus();

    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" trying again in 5 seconds");
      digitalWrite(LED_PIN, LOW);
      delay(5000);
    }
  }
}

// ========== MQTT Callback ==========
void callback(char* topic, byte* payload, unsigned int length) {
  Serial.print("Message arrived [");
  Serial.print(topic);
  Serial.print("]: ");

  String message = "";
  for (int i = 0; i < length; i++) {
    message += (char)payload[i];
  }
  Serial.println(message);

  // Parse JSON command
  StaticJsonDocument<200> doc;
  DeserializationError error = deserializeJson(doc, message);

  if (!error) {
    String command = doc["command"].as<String>();

    if (command == "START") {
      machineRunning = true;
      Serial.println("Machine started");
      publishMachineStatus();
    }
    else if (command == "STOP") {
      machineRunning = false;
      Serial.println("Machine stopped");
      publishMachineStatus();
    }
    else if (command == "RESET") {
      Serial.println("Resetting device...");
      ESP.restart();
    }
    else if (command == "STATUS") {
      publishSensorData();
      publishMachineStatus();
    }
  } else {
    Serial.print("JSON parse error: ");
    Serial.println(error.c_str());
  }
}

// ========== Publish All Sensor Data ==========
void publishSensorData() {
  Serial.println("Publishing sensor data...");
  publishTemperature();
  publishLevel();
  publishPressure();
  publishVibration();
  publishMachineStatus();
  publishKPI();
}

// ========== Publish Temperature ==========
void publishTemperature() {
  StaticJsonDocument<200> doc;

  float temp = readTemperature();
  doc["value"] = round(temp * 10) / 10.0;
  doc["unit"] = "°C";
  doc["timestamp"] = millis();
  doc["device_id"] = device_id;
  doc["trend"] = random(-50, 50) / 10.0;

  char buffer[256];
  serializeJson(doc, buffer);

  if (client.publish(topic_temperature, buffer)) {
    Serial.print("Temperature published: ");
    Serial.print(temp);
    Serial.println(" °C");
  }
}

// ========== Publish Level ==========
void publishLevel() {
  StaticJsonDocument<200> doc;

  float level = readLevel();
  doc["value"] = round(level * 10) / 10.0;
  doc["unit"] = "%";
  doc["timestamp"] = millis();
  doc["device_id"] = device_id;
  doc["trend"] = random(-50, 50) / 10.0;

  char buffer[256];
  serializeJson(doc, buffer);

  if (client.publish(topic_level, buffer)) {
    Serial.print("Level published: ");
    Serial.print(level);
    Serial.println(" %");
  }
}

// ========== Publish Pressure ==========
void publishPressure() {
  StaticJsonDocument<200> doc;

  float pressure = readPressure();
  doc["value"] = round(pressure * 10) / 10.0;
  doc["unit"] = "bar";
  doc["timestamp"] = millis();
  doc["device_id"] = device_id;
  doc["trend"] = random(-50, 50) / 10.0;

  char buffer[256];
  serializeJson(doc, buffer);

  if (client.publish(topic_pressure, buffer)) {
    Serial.print("Pressure published: ");
    Serial.print(pressure);
    Serial.println(" bar");
  }
}

// ========== Publish Vibration ==========
void publishVibration() {
  StaticJsonDocument<200> doc;

  float vibration = readVibration();
  doc["value"] = round(vibration * 10) / 10.0;
  doc["unit"] = "mm/s";
  doc["timestamp"] = millis();
  doc["device_id"] = device_id;
  doc["trend"] = random(-50, 50) / 10.0;

  char buffer[256];
  serializeJson(doc, buffer);

  if (client.publish(topic_vibration, buffer)) {
    Serial.print("Vibration published: ");
    Serial.print(vibration);
    Serial.println(" mm/s");
  }

  // Check for high vibration alert
  if (vibration > 8.0) {
    publishMaintenanceAlert("High vibration detected", "warning");
  }
}

// ========== Publish Machine Status ==========
void publishMachineStatus() {
  StaticJsonDocument<200> doc;

  doc["status"] = machineRunning ? "running" : "idle";
  doc["device_id"] = device_id;
  doc["timestamp"] = millis();
  doc["uptime"] = millis() / 1000;

  char buffer[256];
  serializeJson(doc, buffer);

  client.publish(topic_machine_status, buffer);
}

// ========== Publish KPI Metrics ==========
void publishKPI() {
  if (!machineRunning) return;

  // Calculate simulated KPI values
  float availability = random(8500, 9800) / 100.0;
  float performance = random(8000, 9500) / 100.0;
  float quality = random(9000, 9900) / 100.0;
  float oee = (availability * performance * quality) / 10000.0;

  // Publish OEE
  StaticJsonDocument<200> doc1;
  doc1["value"] = round(oee * 10) / 10.0;
  doc1["device_id"] = device_id;
  doc1["timestamp"] = millis();

  char buffer1[256];
  serializeJson(doc1, buffer1);
  client.publish(topic_oee, buffer1);

  // Publish Availability
  StaticJsonDocument<200> doc2;
  doc2["value"] = round(availability * 10) / 10.0;
  doc2["device_id"] = device_id;
  doc2["timestamp"] = millis();

  char buffer2[256];
  serializeJson(doc2, buffer2);
  client.publish(topic_availability, buffer2);

  // Publish Performance
  StaticJsonDocument<200> doc3;
  doc3["value"] = round(performance * 10) / 10.0;
  doc3["device_id"] = device_id;
  doc3["timestamp"] = millis();

  char buffer3[256];
  serializeJson(doc3, buffer3);
  client.publish(topic_performance, buffer3);

  // Publish Quality
  StaticJsonDocument<200> doc4;
  doc4["value"] = round(quality * 10) / 10.0;
  doc4["device_id"] = device_id;
  doc4["timestamp"] = millis();

  char buffer4[256];
  serializeJson(doc4, buffer4);
  client.publish(topic_quality, buffer4);

  Serial.print("KPI published - OEE: ");
  Serial.print(oee);
  Serial.println("%");
}

// ========== Publish Maintenance Alert ==========
void publishMaintenanceAlert(String message, String severity) {
  StaticJsonDocument<200> doc;

  doc["message"] = message;
  doc["severity"] = severity;
  doc["equipment"] = device_id;
  doc["timestamp"] = millis();

  char buffer[256];
  serializeJson(doc, buffer);

  client.publish(topic_maintenance_alert, buffer);
  Serial.print("Alert published: ");
  Serial.println(message);
}

// ========== Sensor Reading Functions ==========

float readTemperature() {
  // Simulate temperature reading
  // Replace with actual sensor code (e.g., DHT22, DS18B20, etc.)
  int rawValue = analogRead(TEMP_SENSOR_PIN);
  float voltage = rawValue * (3.3 / 4095.0);

  // Simulated temperature with some variation
  float temperature = baseTemperature + random(-20, 50) / 10.0;

  if (machineRunning) {
    temperature += 5.0;  // Machine running adds heat
  }

  return temperature;
}

float readLevel() {
  // Simulate level reading
  // Replace with actual sensor code (e.g., ultrasonic sensor, pressure sensor, etc.)
  float level = baseLevel + random(-100, 100) / 10.0;
  return constrain(level, 0, 100);
}

float readPressure() {
  // Simulate pressure reading
  // Replace with actual sensor code (e.g., BMP280, BME280, etc.)
  float pressure = 1.0 + random(-20, 20) / 100.0;

  if (machineRunning) {
    pressure += 0.2;  // Machine running increases pressure
  }

  return pressure;
}

float readVibration() {
  // Simulate vibration reading
  // Replace with actual sensor code (e.g., ADXL345, MPU6050, etc.)
  float vibration = random(0, 100) / 10.0;

  if (machineRunning) {
    vibration += 2.0;  // Machine running increases vibration
  }

  return vibration;
}
