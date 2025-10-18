// MQTT Configuration for ESP32 Integration
export const mqttConfig = {
  // Broker Configuration
  broker: {
    host: 'localhost', // Change to your MQTT broker host
    port: 8883, // WebSocket port (usually 8883 for secure, 8080 for non-secure)
    protocol: 'ws', // Use 'wss' for secure WebSocket
    clientId: `iiot_dashboard_${Math.random().toString(16).slice(2, 10)}`,
  },

  // Authentication (if required)
  auth: {
    username: '', // Add your MQTT username
    password: '', // Add your MQTT password
  },

  // Connection Options
  options: {
    keepalive: 60,
    clean: true,
    reconnectPeriod: 1000,
    connectTimeout: 30 * 1000,
  },

  // Topics Configuration
  topics: {
    // Sensor data topics from ESP32
    temperature: 'iiot/sensor/temperature',
    humidity: 'iiot/sensor/humidity',
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
