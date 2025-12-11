import { useEffect, useState } from 'react';

/**
 * Hook untuk check MQTT data availability via polling
 * Lebih simple dan reliable daripada WebSocket connection check
 */
export const useMQTTStatus = (pollInterval = 1000) => {
  const [isConnected, setIsConnected] = useState(false);
  const [hasData, setHasData] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkMQTTStatus = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/mqtt/latest');
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        
        const result = await response.json();
        const dataAvailable = Object.keys(result.data).length > 0;
        
        setIsConnected(result.connected || dataAvailable);
        setHasData(dataAvailable);
        setError(null);
        
        console.log('✅ MQTT Status Check:', {
          connected: result.connected,
          hasData: dataAvailable,
          topics: Object.keys(result.data).length
        });
        
      } catch (err) {
        console.error('❌ MQTT Status Error:', err.message);
        setIsConnected(false);
        setHasData(false);
        setError(err.message);
      }
    };

    // Check immediately
    checkMQTTStatus();

    // Check periodically
    const interval = setInterval(checkMQTTStatus, pollInterval);

    return () => clearInterval(interval);
  }, [pollInterval]);

  return {
    isConnected: isConnected || hasData,
    hasData,
    error
  };
};

export default useMQTTStatus;
