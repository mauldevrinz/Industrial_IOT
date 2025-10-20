import mqtt from 'mqtt';
import { mqttConfig } from '../config/mqtt.config';

class MQTTService {
  constructor() {
    this.client = null;
    this.subscribers = new Map();
    this.connectionStatus = 'disconnected';
    this.connectionStartTime = null; // Track connection start time globally
    this.latestSensorData = {
      temperature: { current: 0, history: [] },
      levelLow: { current: 0, history: [] },
      levelHigh: { current: 0, history: [] },
      pressure: { current: 0, history: [] },
      co2: { current: 0, history: [] },
    }; // Store latest sensor data globally
  }

  // Connect to MQTT broker
  connect() {
    return new Promise((resolve, reject) => {
      try {
        const { broker, auth, options } = mqttConfig;
        // Build URL with path
        const path = broker.path || '/mqtt';
        const url = `${broker.protocol}://${broker.host}:${broker.port}${path}`;

        const connectOptions = {
          ...options,
          clientId: broker.clientId,
          username: auth.username || undefined,
          password: auth.password || undefined,
        };

        console.log('🔌 Connecting to MQTT broker:', url);
        console.log('📋 Client ID:', connectOptions.clientId);
        console.log('🛤️  Path:', path);

        this.client = mqtt.connect(url, connectOptions);

        // Log all events for debugging
        this.client.on('connect', (connack) => {
          console.log('✅ MQTT Connected successfully!');
          console.log('📡 Broker:', broker.host);
          console.log('📋 CONNACK:', connack);
          this.connectionStatus = 'connected';

          // Set connection start time if not already set
          if (!this.connectionStartTime) {
            this.connectionStartTime = Date.now();
            console.log('⏰ Connection start time set:', new Date(this.connectionStartTime).toISOString());
          }

          resolve(this.client);
        });

        this.client.on('disconnect', (packet) => {
          console.log('🔌 MQTT Disconnect event');
          console.log('   Packet:', packet);
        });

        this.client.on('packetsend', (packet) => {
          console.log('📤 Packet sent:', packet.cmd);
        });

        this.client.on('packetreceive', (packet) => {
          console.log('📥 Packet received:', packet.cmd);
        });

        this.client.on('error', (error) => {
          console.error('❌ MQTT Connection Error:', error);
          console.error('   URL:', url);
          console.error('   Error details:', error.message);
          console.error('   Error code:', error.code);
          this.connectionStatus = 'error';

          // Don't reject on reconnection errors
          if (error.message && error.message.includes('client disconnecting')) {
            console.warn('⚠️  Client disconnecting - will retry');
          } else {
            reject(error);
          }
        });

        this.client.on('reconnect', () => {
          console.log('🔄 MQTT Reconnecting...');
          this.connectionStatus = 'reconnecting';
        });

        this.client.on('close', () => {
          console.log('⏹️  MQTT Connection Closed');
          this.connectionStatus = 'disconnected';
        });

        this.client.on('offline', () => {
          console.log('📴 MQTT Client Offline');
          this.connectionStatus = 'disconnected';
        });

        this.client.on('end', () => {
          console.log('🔚 MQTT Client Ended');
          this.connectionStatus = 'disconnected';
        });

        this.client.on('message', (topic, message) => {
          console.log('📨 Message received:', topic);
          this.handleMessage(topic, message);
        });
      } catch (error) {
        console.error('❌ Fatal error in connect():', error);
        reject(error);
      }
    });
  }

  // Handle incoming messages
  handleMessage(topic, message) {
    try {
      const messageStr = message.toString();
      console.log('📥 Raw message from topic:', topic);
      console.log('   Data:', messageStr);

      const payload = JSON.parse(messageStr);
      console.log('✅ Parsed payload:', payload);

      // Notify all subscribers for this topic
      if (this.subscribers.has(topic)) {
        console.log(`📢 Notifying ${this.subscribers.get(topic).length} subscriber(s) for topic: ${topic}`);
        this.subscribers.get(topic).forEach(callback => {
          callback(payload);
        });
      } else {
        console.warn(`⚠️  No subscribers for topic: ${topic}`);
        console.log('   Available subscriptions:', Array.from(this.subscribers.keys()));
      }

      // Notify wildcard subscribers
      this.subscribers.forEach((callbacks, subscribedTopic) => {
        if (subscribedTopic.includes('#') || subscribedTopic.includes('+')) {
          const regex = new RegExp(
            subscribedTopic.replace(/\+/g, '[^/]+').replace(/#/g, '.*')
          );
          if (regex.test(topic)) {
            console.log(`📢 Notifying wildcard subscribers for: ${subscribedTopic}`);
            callbacks.forEach(callback => callback(payload, topic));
          }
        }
      });
    } catch (error) {
      console.error('❌ Error parsing MQTT message:', error);
      console.error('   Topic:', topic);
      console.error('   Message:', message.toString());
    }
  }

  // Subscribe to a topic
  subscribe(topic, callback, qos = mqttConfig.qos.default) {
    if (!this.client || !this.client.connected) {
      console.warn('⚠️  MQTT client not connected - queueing subscription for', topic);

      // Queue the subscription to be done after connection
      const doSubscribe = () => {
        if (this.client && this.client.connected) {
          this.client.off('connect', doSubscribe);
          this.subscribe(topic, callback, qos);
        }
      };
      this.client.once('connect', doSubscribe);
      return;
    }

    // Store callback for this topic FIRST (before MQTT subscribe)
    if (!this.subscribers.has(topic)) {
      this.subscribers.set(topic, []);

      // Only subscribe to MQTT topic once (when first subscriber is added)
      console.log(`📡 First subscription to topic: ${topic} (QoS: ${qos})`);

      // Add delay between subscriptions to avoid overwhelming broker
      setTimeout(() => {
        if (this.client && this.client.connected) {
          this.client.subscribe(topic, { qos }, (error) => {
            if (error) {
              console.error(`❌ Error subscribing to ${topic}:`, error);
              return;
            }
            console.log(`✅ Successfully subscribed to ${topic}`);
          });
        }
      }, this.subscribers.size * 100); // 100ms delay per subscription
    } else {
      console.log(`📎 Adding callback to existing subscription: ${topic}`);
    }

    this.subscribers.get(topic).push(callback);
    console.log(`   Total callbacks for ${topic}: ${this.subscribers.get(topic).length}`);

    // Return unsubscribe function
    return () => this.unsubscribe(topic, callback);
  }

  // Unsubscribe from a topic
  unsubscribe(topic, callback) {
    if (!this.client) return;

    if (this.subscribers.has(topic)) {
      const callbacks = this.subscribers.get(topic);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }

      // If no more callbacks, unsubscribe from topic
      if (callbacks.length === 0) {
        this.client.unsubscribe(topic);
        this.subscribers.delete(topic);
        console.log(`Unsubscribed from ${topic}`);
      }
    }
  }

  // Publish a message
  publish(topic, message, qos = mqttConfig.qos.default) {
    if (!this.client) {
      console.error('MQTT client not connected');
      return;
    }

    const payload = typeof message === 'string' ? message : JSON.stringify(message);

    this.client.publish(topic, payload, { qos }, (error) => {
      if (error) {
        console.error(`Error publishing to ${topic}:`, error);
      } else {
        console.log(`Published to ${topic}:`, payload);
      }
    });
  }

  // Disconnect from broker
  disconnect() {
    if (this.client) {
      this.client.end();
      this.client = null;
      this.subscribers.clear();
      this.connectionStatus = 'disconnected';
      this.connectionStartTime = null;
    }
  }

  // Get connection status
  getStatus() {
    return this.connectionStatus;
  }

  // Check if connected
  isConnected() {
    return this.connectionStatus === 'connected';
  }

  // Get connection runtime in seconds
  getRuntime() {
    if (!this.connectionStartTime || this.connectionStatus !== 'connected') {
      return 0;
    }
    return Math.floor((Date.now() - this.connectionStartTime) / 1000);
  }

  // Get latest sensor data
  getLatestSensorData() {
    return this.latestSensorData;
  }

  // Update sensor data (called from hooks)
  updateSensorData(sensorType, data) {
    if (this.latestSensorData[sensorType]) {
      this.latestSensorData[sensorType] = data;
    }
  }
}

// Export singleton instance
export const mqttService = new MQTTService();
export default mqttService;
