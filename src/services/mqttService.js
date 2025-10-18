import mqtt from 'mqtt';
import { mqttConfig } from '../config/mqtt.config';

class MQTTService {
  constructor() {
    this.client = null;
    this.subscribers = new Map();
    this.connectionStatus = 'disconnected';
  }

  // Connect to MQTT broker
  connect() {
    return new Promise((resolve, reject) => {
      try {
        const { broker, auth, options } = mqttConfig;
        const url = `${broker.protocol}://${broker.host}:${broker.port}`;

        const connectOptions = {
          ...options,
          clientId: broker.clientId,
          username: auth.username || undefined,
          password: auth.password || undefined,
        };

        this.client = mqtt.connect(url, connectOptions);

        this.client.on('connect', () => {
          console.log('MQTT Connected');
          this.connectionStatus = 'connected';
          resolve(this.client);
        });

        this.client.on('error', (error) => {
          console.error('MQTT Connection Error:', error);
          this.connectionStatus = 'error';
          reject(error);
        });

        this.client.on('reconnect', () => {
          console.log('MQTT Reconnecting...');
          this.connectionStatus = 'reconnecting';
        });

        this.client.on('close', () => {
          console.log('MQTT Connection Closed');
          this.connectionStatus = 'disconnected';
        });

        this.client.on('message', (topic, message) => {
          this.handleMessage(topic, message);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  // Handle incoming messages
  handleMessage(topic, message) {
    try {
      const payload = JSON.parse(message.toString());

      // Notify all subscribers for this topic
      if (this.subscribers.has(topic)) {
        this.subscribers.get(topic).forEach(callback => {
          callback(payload);
        });
      }

      // Notify wildcard subscribers
      this.subscribers.forEach((callbacks, subscribedTopic) => {
        if (subscribedTopic.includes('#') || subscribedTopic.includes('+')) {
          const regex = new RegExp(
            subscribedTopic.replace(/\+/g, '[^/]+').replace(/#/g, '.*')
          );
          if (regex.test(topic)) {
            callbacks.forEach(callback => callback(payload, topic));
          }
        }
      });
    } catch (error) {
      console.error('Error parsing MQTT message:', error);
    }
  }

  // Subscribe to a topic
  subscribe(topic, callback, qos = mqttConfig.qos.default) {
    if (!this.client) {
      console.error('MQTT client not connected');
      return;
    }

    this.client.subscribe(topic, { qos }, (error) => {
      if (error) {
        console.error(`Error subscribing to ${topic}:`, error);
        return;
      }
      console.log(`Subscribed to ${topic}`);
    });

    // Store callback for this topic
    if (!this.subscribers.has(topic)) {
      this.subscribers.set(topic, []);
    }
    this.subscribers.get(topic).push(callback);

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
}

// Export singleton instance
export const mqttService = new MQTTService();
export default mqttService;
