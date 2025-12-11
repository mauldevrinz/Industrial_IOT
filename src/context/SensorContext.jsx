import React, { createContext, useContext, useState, useEffect } from 'react';

const SensorContext = createContext();

export const SensorProvider = ({ children }) => {
  // Runtime state - persist to localStorage
  const [runtime, setRuntime] = useState(() => {
    const saved = localStorage.getItem('iiot_runtime');
    return saved ? parseInt(saved) : 0;
  });

  // Sensor history - persist to localStorage
  const [sensorHistory, setSensorHistory] = useState(() => {
    const saved = localStorage.getItem('iiot_sensor_history');
    return saved ? JSON.parse(saved) : {
      adxl345: { ax: [], ay: [], az: [] },
      mpu6050: { accel_x: [], accel_y: [], accel_z: [], gyro_x: [], gyro_y: [], gyro_z: [], temp: [] },
      bmp280: { temp: [], pressure: [], altitude: [] }
    };
  });

  // Motor status state
  const [motorStatus, setMotorStatus] = useState({
    label: 'unknown',
    status: 'Waiting',
    voltage_stable: false,
    confidence: 0
  });

  const MAX_HISTORY = 50;

  // Persist runtime to localStorage
  useEffect(() => {
    localStorage.setItem('iiot_runtime', runtime.toString());
  }, [runtime]);

  // Persist sensor history to localStorage
  useEffect(() => {
    localStorage.setItem('iiot_sensor_history', JSON.stringify(sensorHistory));
  }, [sensorHistory]);

  // Auto-increment runtime every second
  useEffect(() => {
    const interval = setInterval(() => {
      setRuntime(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const addDataPoint = (sensor, param, value) => {
    setSensorHistory(prev => {
      const newHistory = [...(prev[sensor][param] || []), {
        timestamp: Date.now(),
        value: value
      }];

      if (newHistory.length > MAX_HISTORY) {
        newHistory.shift();
      }

      return {
        ...prev,
        [sensor]: {
          ...prev[sensor],
          [param]: newHistory
        }
      };
    });
  };

  const resetAll = () => {
    setRuntime(0);
    setSensorHistory({
      adxl345: { ax: [], ay: [], az: [] },
      mpu6050: { accel_x: [], accel_y: [], accel_z: [], gyro_x: [], gyro_y: [], gyro_z: [], temp: [] },
      bmp280: { temp: [], pressure: [], altitude: [] }
    });
    setMotorStatus({
      label: 'unknown',
      status: 'Waiting',
      voltage_stable: false,
      confidence: 0
    });
    localStorage.removeItem('iiot_runtime');
    localStorage.removeItem('iiot_sensor_history');
  };

  return (
    <SensorContext.Provider value={{
      runtime,
      setRuntime,
      sensorHistory,
      setSensorHistory,
      addDataPoint,
      motorStatus,
      setMotorStatus,
      resetAll,
      MAX_HISTORY
    }}>
      {children}
    </SensorContext.Provider>
  );
};

export const useSensorContext = () => {
  const context = useContext(SensorContext);
  if (!context) {
    throw new Error('useSensorContext must be used within SensorProvider');
  }
  return context;
};

export default SensorContext;
