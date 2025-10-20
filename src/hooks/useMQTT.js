import { useEffect, useState, useCallback, useRef } from 'react';
import { mqttService } from '../services/mqttService';

// Global flag to track if MQTT is already connected
let globalConnectionInitialized = false;
let globalConnectionPromise = null;

export const useMQTT = () => {
  const [connectionStatus, setConnectionStatus] = useState(mqttService.getStatus());
  const [error, setError] = useState(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;

    // Only connect once globally, not per component
    if (!globalConnectionInitialized) {
      globalConnectionInitialized = true;
      console.log('🌐 Initializing global MQTT connection...');

      globalConnectionPromise = mqttService
        .connect()
        .then(() => {
          if (isMounted.current) {
            setConnectionStatus('connected');
            setError(null);
          }
        })
        .catch((err) => {
          if (isMounted.current) {
            setConnectionStatus('error');
            setError(err.message);
          }
        });
    } else {
      // Use existing connection
      console.log('♻️  Reusing existing MQTT connection');
      if (globalConnectionPromise) {
        globalConnectionPromise.then(() => {
          if (isMounted.current) {
            setConnectionStatus(mqttService.getStatus());
          }
        });
      }
    }

    // Update status periodically
    const statusInterval = setInterval(() => {
      if (isMounted.current) {
        setConnectionStatus(mqttService.getStatus());
      }
    }, 2000); // Reduced frequency to 2 seconds

    // Cleanup on unmount - DON'T disconnect, just cleanup interval
    return () => {
      isMounted.current = false;
      clearInterval(statusInterval);
      // DO NOT DISCONNECT - let the connection persist
      console.log('🧹 Component unmounted, keeping MQTT connection alive');
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
