import { useState, useEffect } from 'react';
import { useMQTT } from './useMQTT';
import { mqttConfig } from '../config/mqtt.config';
import { mqttService } from '../services/mqttService';

export const useSensorData = (topic, sensorType) => {
  // Initialize from global data if available
  const globalData = mqttService.getLatestSensorData();
  const [data, setData] = useState(globalData[sensorType]?.data || null);
  const [history, setHistory] = useState(globalData[sensorType]?.history || []);
  const [lastUpdate, setLastUpdate] = useState(globalData[sensorType]?.lastUpdate || null);
  const { subscribe, isConnected } = useMQTT();

  useEffect(() => {
    if (!isConnected) {
      console.log(`⏳ Waiting for MQTT connection to subscribe to ${topic}`);
      return;
    }

    console.log(`🔔 Setting up subscription for ${topic}`);

    const handleMessage = (payload) => {
      const timestamp = new Date();
      setData(payload);
      setLastUpdate(timestamp);

      // Keep last 50 data points for history
      setHistory(prev => {
        const newHistory = [...prev, { ...payload, timestamp }];
        const trimmedHistory = newHistory.slice(-50);

        // Update global store with NEW history
        if (sensorType) {
          mqttService.updateSensorData(sensorType, {
            data: payload,
            history: trimmedHistory,
            lastUpdate: timestamp
          });
        }

        return trimmedHistory;
      });
    };

    const unsubscribe = subscribe(topic, handleMessage);

    return () => {
      console.log(`🔕 Cleaning up subscription for ${topic}`);
      if (unsubscribe) unsubscribe();
    };
  }, [topic, isConnected]); // Removed 'subscribe' from deps to prevent re-subscribing

  return { data, history, lastUpdate };
};

export const useMultipleSensors = () => {
  const { topics } = mqttConfig;

  const temperatureRaw = useSensorData(topics.temperature, 'temperature');
  const levelLowRaw = useSensorData(topics.levelLow, 'levelLow');
  const levelHighRaw = useSensorData(topics.levelHigh, 'levelHigh');
  const pressureRaw = useSensorData(topics.pressure, 'pressure');
  const co2Raw = useSensorData(topics.co2, 'co2');

  // Transform data to include 'current' property
  const transformSensorData = (sensorData) => ({
    current: sensorData.data?.value || 0,
    history: sensorData.history || [],
    lastUpdate: sensorData.lastUpdate,
  });

  // Calculate level from low and high sensors
  const calculateLevel = () => {
    const low = levelLowRaw.data?.value || 0;
    const high = levelHighRaw.data?.value || 0;

    // Level logic:
    // low=0, high=0 -> Level 1 (Empty)
    // low=1, high=0 -> Level 2 (Filling)
    // low=1, high=1 -> Level 3 (Full)
    // low=0, high=1 -> ERROR (physically impossible, sensor malfunction)
    if (low === 0 && high === 0) return 1;
    if (low === 1 && high === 0) return 2;
    if (low === 1 && high === 1) return 3;
    if (low === 0 && high === 1) {
      console.error('⚠️ SENSOR ERROR: High sensor active but low sensor inactive (L:0 H:1)');
      return 0; // Error state
    }
    return 1; // Default to empty
  };

  // Create level history based on sensor changes
  const levelHistory = [];
  const maxLength = Math.max(levelLowRaw.history.length, levelHighRaw.history.length);

  for (let i = 0; i < maxLength; i++) {
    const lowVal = levelLowRaw.history[i]?.value || 0;
    const highVal = levelHighRaw.history[i]?.value || 0;
    const timestamp = levelLowRaw.history[i]?.timestamp || levelHighRaw.history[i]?.timestamp;

    let level = 1;
    if (lowVal === 0 && highVal === 0) level = 1;
    else if (lowVal === 1 && highVal === 0) level = 2;
    else if (lowVal === 1 && highVal === 1) level = 3;
    else if (lowVal === 0 && highVal === 1) level = 0; // Error state

    levelHistory.push({
      value: level,
      timestamp: timestamp
    });
  }

  return {
    temperature: transformSensorData(temperatureRaw),
    level: {
      current: calculateLevel(),
      history: levelHistory,
      lastUpdate: levelLowRaw.lastUpdate || levelHighRaw.lastUpdate,
      lowSensor: levelLowRaw.data?.value || 0,
      highSensor: levelHighRaw.data?.value || 0,
    },
    pressure: transformSensorData(pressureRaw),
    co2: transformSensorData(co2Raw),
  };
};

export default useSensorData;
