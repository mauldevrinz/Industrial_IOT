// MQTT Configuration for ESP32 Integration
export const mqttConfig = {
  // Broker Configuration - use HiveMQ public broker WebSocket
  broker: {
    host: 'broker.hivemq.com', // HiveMQ public broker
    port: 8001, // WebSocket Secure port
    protocol: 'wss', // Use 'wss' for Secure WebSocket
    path: '/mqtt', // MQTT WebSocket path
    // Use more unique client ID to avoid collisions
    clientId: `iiot_web_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
  },

  // Authentication (if required)
  auth: {
    username: '', // Add your MQTT username
    password: '', // Add your MQTT password
  },

  // Connection Options
  options: {
    keepalive: 60, // Increased to 60 seconds
    clean: true,
    reconnectPeriod: 10000, // Increased to 10 seconds to avoid spam
    connectTimeout: 45 * 1000, // Increased to 45 seconds
    will: undefined, // No last will message
    rejectUnauthorized: false, // Accept self-signed certificates
    protocolVersion: 4, // Use MQTT v3.1.1
  },

  // Topics Configuration
  topics: {
    // Sensor data topics from ESP32
    temperature: 'iiot/sensor/temperature',
    levelLow: 'iiot/sensor/level/low',   // Low level sensor (0 or 1)
    levelHigh: 'iiot/sensor/level/high', // High level sensor (0 or 1)
    pressure: 'iiot/sensor/pressure',
    co2: 'iiot/sensor/co2',

    // Machine status topics
    machineStatus: 'iiot/machine/status',
    machineSpeed: 'iiot/machine/speed',
    machineOutput: 'iiot/machine/output',

    // KPI topics
    oee: 'iiot/kpi/oee', // Overall Equipment Effectiveness
    availability: 'iiot/kpi/availability',
    performance: 'iiot/kpi/performance',
    quality: 'iiot/kpi/quality',

    // Maintenance topics
    maintenanceAlert: 'iiot/maintenance/alert',
    maintenanceSchedule: 'iiot/maintenance/schedule',

    // Command topics (for controlling ESP32)
    command: 'iiot/command',
    control: 'iiot/control',

    // Actuator control topics
    actuator: {
      motor: 'iiot/actuator/motor',
      pump: 'iiot/actuator/pump',
      fan: 'iiot/actuator/fan',
      heater: 'iiot/actuator/heater',
      valve: 'iiot/actuator/valve',
      compressor: 'iiot/actuator/compressor',
      status: 'iiot/actuator/status', // Subscribe to get all actuator states
    },
  },

  // QoS Levels
  qos: {
    default: 1, // 0: At most once, 1: At least once, 2: Exactly once
    critical: 2,
  },
};

export default mqttConfig;
