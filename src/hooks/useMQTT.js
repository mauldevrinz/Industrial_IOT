import { useEffect, useState, useCallback } from 'react';
import { mqttService } from '../services/mqttService';

export const useMQTT = () => {
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [error, setError] = useState(null);

  useEffect(() => {
    // Connect to MQTT broker on mount
    mqttService
      .connect()
      .then(() => {
        setConnectionStatus('connected');
        setError(null);
      })
      .catch((err) => {
        setConnectionStatus('error');
        setError(err.message);
      });

    // Update status periodically
    const statusInterval = setInterval(() => {
      setConnectionStatus(mqttService.getStatus());
    }, 1000);

    // Cleanup on unmount
    return () => {
      clearInterval(statusInterval);
      mqttService.disconnect();
    };
  }, []);

  const subscribe = useCallback((topic, callback, qos) => {
    return mqttService.subscribe(topic, callback, qos);
  }, []);

  const publish = useCallback((topic, message, qos) => {
    mqttService.publish(topic, message, qos);
  }, []);

  const unsubscribe = useCallback((topic, callback) => {
    mqttService.unsubscribe(topic, callback);
  }, []);

  return {
    connectionStatus,
    error,
    subscribe,
    publish,
    unsubscribe,
    isConnected: connectionStatus === 'connected',
  };
};

export default useMQTT;
