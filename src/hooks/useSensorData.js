import { useState, useEffect } from 'react';
import { useMQTT } from './useMQTT';
import { mqttConfig } from '../config/mqtt.config';

export const useSensorData = (topic) => {
  const [data, setData] = useState(null);
  const [history, setHistory] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(null);
  const { subscribe, isConnected } = useMQTT();

  useEffect(() => {
    if (!isConnected) return;

    const unsubscribe = subscribe(topic, (payload) => {
      const timestamp = new Date();
      setData(payload);
      setLastUpdate(timestamp);

      // Keep last 50 data points for history
      setHistory(prev => {
        const newHistory = [...prev, { ...payload, timestamp }];
        return newHistory.slice(-50);
      });
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [topic, subscribe, isConnected]);

  return { data, history, lastUpdate };
};

export const useMultipleSensors = () => {
  const { topics } = mqttConfig;

  const temperatureRaw = useSensorData(topics.temperature);
  const humidityRaw = useSensorData(topics.humidity);
  const pressureRaw = useSensorData(topics.pressure);
  const co2Raw = useSensorData(topics.co2);

  // Transform data to include 'current' property
  const transformSensorData = (sensorData) => ({
    current: sensorData.data?.value || 0,
    history: sensorData.history || [],
    lastUpdate: sensorData.lastUpdate,
  });

  return {
    temperature: transformSensorData(temperatureRaw),
    humidity: transformSensorData(humidityRaw),
    pressure: transformSensorData(pressureRaw),
    co2: transformSensorData(co2Raw),
  };
};

export default useSensorData;
