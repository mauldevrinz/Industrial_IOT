import { useEffect, useState, useRef } from 'react';

export const useMQTTPolling = (pollInterval = 1000) => {
  const [sensorData, setSensorData] = useState({
    adxl345: { ax: 0, ay: 0, az: 0 },
    mpu6050: { accel: { x: 0, y: 0, z: 0 }, gyro: { x: 0, y: 0, z: 0 }, temp: 0 },
    bmp280: { temp: 0, pressure: 0, altitude: 0 }
  });
  const [motorStatus, setMotorStatus] = useState({
    label: 'unknown',
    status: 'Waiting',
    voltage_stable: false,
    confidence: 0
  });
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const pollIntervalRef = useRef(null);

  useEffect(() => {
    const pollData = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/mqtt/latest');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        
        setIsConnected(result.connected);
        setError(null);

        // Process sensor data
        const data = result.data;
        
        if (data['iiot/sensors/adxl345']) {
          setSensorData(prev => ({
            ...prev,
            adxl345: data['iiot/sensors/adxl345']
          }));
        }
        
        if (data['iiot/sensors/mpu6050']) {
          setSensorData(prev => ({
            ...prev,
            mpu6050: data['iiot/sensors/mpu6050']
          }));
        }
        
        if (data['iiot/sensors/bmp280']) {
          setSensorData(prev => ({
            ...prev,
            bmp280: data['iiot/sensors/bmp280']
          }));
        }

        // Process motor status
        if (data['iiot/motor/status']) {
          const status = data['iiot/motor/status'];
          setMotorStatus({
            label: status.label || 'unknown',
            status: status.status || (status.label === 'normal' ? 'Normal' : 'Drop Voltage'),
            voltage_stable: status.voltage_stable !== undefined ? status.voltage_stable : status.label === 'normal',
            confidence: status.confidence || 0
          });
        }

      } catch (err) {
        console.error('❌ MQTT polling error:', err);
        setIsConnected(false);
        setError(err.message);
      }
    };

    // Initial poll
    pollData();

    // Set up polling interval
    pollIntervalRef.current = setInterval(pollData, pollInterval);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [pollInterval]);

  return {
    sensorData,
    motorStatus,
    isConnected,
    error
  };
};

export default useMQTTPolling;
