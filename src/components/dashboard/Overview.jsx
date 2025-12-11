import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Thermometer,
  Droplets,
  Gauge as GaugeIcon,
  Zap,
  TrendingUp,
  Fan,
  Lightbulb,
  Wind,
  Activity,
  Clock,
  Cpu,
  Box
} from 'lucide-react';
import { useMultipleSensors } from '../../hooks/useSensorData';
import { useMQTT } from '../../hooks/useMQTT';
import { useMQTTPolling } from '../../hooks/useMQTTPolling';
import { useSensorContext } from '../../context/SensorContext';
import { mqttConfig } from '../../config/mqtt.config';
import { mqttService } from '../../services/mqttService';

const Overview = () => {
  const { temperature, level, pressure, co2 } = useMultipleSensors();
  const { isConnected, publish, subscribe } = useMQTT();
  const pollData = useMQTTPolling(1000); // Poll every 1 second
  
  // Use context for persistent runtime and sensor data
  const { runtime, setRuntime, motorStatus, setMotorStatus } = useSensorContext();

  // Current sensor reading (real-time, not persistent)
  const [sensors, setSensors] = useState({
    adxl345: { ax: 0, ay: 0, az: 0 },
    mpu6050: { accel: { x: 0, y: 0, z: 0 }, gyro: { x: 0, y: 0, z: 0 }, temp: 0 },
    bmp280: { temp: 0, pressure: 0, altitude: 0 }
  });

  // Throttle buffer - stores latest data but only updates UI periodically
  const throttleBuffer = useRef({
    adxl345: null,
    mpu6050: null,
    bmp280: null
  });
  const lastUpdateTime = useRef({ adxl345: 0, mpu6050: 0, bmp280: 0 });
  const THROTTLE_MS = 100; // Update UI every 100ms to match ESP32 data rate

  // Subscribe to ESP32 sensors from MQTT
  useEffect(() => {
    if (!isConnected) {
      console.log('⏳ Not connected yet, skipping subscriptions');
      return;
    }

    console.log('✅ Connected! Setting up subscriptions...');

    const handleADXL = (payload) => {
      if (payload?.ax !== undefined) {
        // Direct update without throttle for real-time response
        setSensors(prev => ({
          ...prev,
          adxl345: {
            ax: payload.ax,
            ay: payload.ay,
            az: payload.az
          }
        }));
      }
    };

    const handleMPU = (payload) => {
      if (payload?.accel?.x !== undefined) {
        // Direct update without throttle for real-time response
        setSensors(prev => ({
          ...prev,
          mpu6050: {
            accel: {
              x: payload.accel.x,
              y: payload.accel.y,
              z: payload.accel.z
            },
            gyro: {
              x: payload.gyro.x,
              y: payload.gyro.y,
              z: payload.gyro.z
            },
            temp: payload.temp
          }
        }));
      }
    };

    const handleBMP = (payload) => {
      if (payload?.temp !== undefined) {
        // Direct update without throttle for real-time response
        setSensors(prev => ({
          ...prev,
          bmp280: {
            temp: payload.temp,
            pressure: payload.pressure,
            altitude: payload.altitude
          }
        }));
      }
    };

    const handleMotorStatus = (payload) => {
      if (payload?.label !== undefined) {
        setMotorStatus({
          label: payload.label,
          status: payload.status || (payload.label === 'normal' ? 'Normal' : 'Drop Voltage'),
          voltage_stable: payload.voltage_stable !== undefined ? payload.voltage_stable : payload.label === 'normal',
          confidence: payload.confidence || 0
        });
      }
    };

    subscribe('iiot/sensors/adxl345', handleADXL);
    subscribe('iiot/sensors/mpu6050', handleMPU);
    subscribe('iiot/sensors/bmp280', handleBMP);
    subscribe('iiot/motor/status', handleMotorStatus);
    
    console.log('✅ Subscribed to ESP32 sensors and motor status');

  }, [isConnected, subscribe]);

  // Sync polling data when available (fallback untuk WebSocket)
  useEffect(() => {
    if (pollData.isConnected) {
      setSensors(pollData.sensorData);
      setMotorStatus(pollData.motorStatus);
      console.log('📊 Data updated from polling');
    }
  }, [pollData.sensorData, pollData.motorStatus, pollData.isConnected]);

  // Format runtime as HH:MM:SS
  const formatRuntime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const calculateTrend = (history) => {
    if (history.length < 2) return 0;
    const latest = history[history.length - 1]?.value || 0;
    const previous = history[history.length - 2]?.value || 0;
    return previous !== 0 ? ((latest - previous) / previous) * 100 : 0;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      {/* Hero Section with Side Image and Floating Card */}
      <div className="relative py-4 md:py-8 overflow-visible bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="px-4 md:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 items-stretch gap-4 md:gap-8 max-w-[1800px] mx-auto">
          {/* Column 1 - Image */}
          <div className="flex items-center justify-center h-full order-2 lg:order-1">
            <img
              src="/bg.png"
              alt="Industrial IoT"
              className="w-full h-full object-cover rounded-xl md:rounded-3xl"
            />
          </div>

          {/* Column 2 - Floating Transparent Cards */}
          <div className="flex flex-col justify-between space-y-3 md:space-y-5 h-full order-1 lg:order-2">

            {/* Floating Sensor Cards */}
            <div className="grid grid-cols-2 gap-2 md:gap-3">
              {/* ADXL345 Status Card */}
              <div className="bg-gradient-to-br from-blue-100 via-cyan-100 to-sky-100 backdrop-blur-xl rounded-lg md:rounded-xl p-3 md:p-4 shadow-lg border-2 border-blue-300 hover:shadow-xl hover:scale-105 transition-all duration-300">
                <div className="flex items-center space-x-2 md:space-x-3 mb-2 md:mb-3">
                  <div className="p-1.5 md:p-2.5 rounded-lg md:rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-md">
                    <Cpu className="w-4 h-4 md:w-5 md:h-5 text-white" />
                  </div>
                  <span className="text-[10px] md:text-xs font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">ADXL345</span>
                </div>
                <div className="flex items-baseline space-x-1 md:space-x-2">
                  <span className="text-2xl md:text-3xl font-bold text-emerald-600">● Active</span>
                </div>
                <div className="mt-1 md:mt-2 flex items-center justify-between">
                  <span className="text-[10px] md:text-xs text-[#737491]">3-Axis Accel</span>
                  <span className="text-[10px] md:text-xs font-bold text-emerald-600">
                    ✓ Ready
                  </span>
                </div>
              </div>

              {/* MPU6050 Status Card */}
              <div className="bg-gradient-to-br from-blue-100 via-cyan-100 to-sky-100 backdrop-blur-xl rounded-lg md:rounded-xl p-3 md:p-4 shadow-lg border-2 border-blue-300 hover:shadow-xl hover:scale-105 transition-all duration-300">
                <div className="flex items-center space-x-2 md:space-x-3 mb-2 md:mb-3">
                  <div className="p-1.5 md:p-2.5 rounded-lg md:rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-md">
                    <Box className="w-4 h-4 md:w-5 md:h-5 text-white" />
                  </div>
                  <span className="text-[10px] md:text-xs font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">MPU6050</span>
                </div>
                <div className="flex items-baseline space-x-1 md:space-x-2">
                  <span className="text-2xl md:text-3xl font-bold text-emerald-600">● Active</span>
                </div>
                <div className="mt-1 md:mt-2 flex items-center justify-between">
                  <span className="text-[10px] md:text-xs text-[#737491]">6-Axis IMU</span>
                  <span className="text-[10px] md:text-xs font-bold text-emerald-600">
                    ✓ Ready
                  </span>
                </div>
              </div>

              {/* BMP280 Status Card */}
              <div className="bg-gradient-to-br from-blue-100 via-cyan-100 to-sky-100 backdrop-blur-xl rounded-lg md:rounded-xl p-3 md:p-4 shadow-lg border-2 border-blue-300 hover:shadow-xl hover:scale-105 transition-all duration-300">
                <div className="flex items-center space-x-2 md:space-x-3 mb-2 md:mb-3">
                  <div className="p-1.5 md:p-2.5 rounded-lg md:rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-md">
                    <GaugeIcon className="w-4 h-4 md:w-5 md:h-5 text-white" />
                  </div>
                  <span className="text-[10px] md:text-xs font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">BMP280</span>
                </div>
                <div className="flex items-baseline space-x-1 md:space-x-2">
                  <span className="text-2xl md:text-3xl font-bold text-emerald-600">● Active</span>
                </div>
                <div className="mt-1 md:mt-2 flex items-center justify-between">
                  <span className="text-[10px] md:text-xs text-[#737491]">Barometric</span>
                  <span className="text-[10px] md:text-xs font-bold text-emerald-600">
                    ✓ Ready
                  </span>
                </div>
              </div>

              {/* Motor Status Card - Edge Impulse Classification */}
              <div className={`backdrop-blur-xl rounded-lg md:rounded-xl p-3 md:p-4 shadow-lg border-2 hover:shadow-xl hover:scale-105 transition-all duration-300 ${
                motorStatus.label === 'normal' 
                  ? 'bg-gradient-to-br from-emerald-100 via-green-100 to-teal-100 border-emerald-300' 
                  : motorStatus.label === 'drop_voltage'
                  ? 'bg-gradient-to-br from-red-100 via-orange-100 to-yellow-100 border-red-300'
                  : 'bg-gradient-to-br from-gray-100 via-slate-100 to-gray-100 border-gray-300'
              }`}>
                <div className="flex items-center space-x-2 md:space-x-3 mb-2 md:mb-3">
                  <div className={`p-1.5 md:p-2.5 rounded-lg md:rounded-xl shadow-md ${
                    motorStatus.label === 'normal'
                      ? 'bg-gradient-to-br from-emerald-500 to-green-500'
                      : motorStatus.label === 'drop_voltage'
                      ? 'bg-gradient-to-br from-red-500 to-orange-500'
                      : 'bg-gradient-to-br from-gray-500 to-slate-500'
                  }`}>
                    <Zap className="w-4 h-4 md:w-5 md:h-5 text-white" />
                  </div>
                  <span className={`text-[10px] md:text-xs font-bold bg-clip-text text-transparent ${
                    motorStatus.label === 'normal'
                      ? 'bg-gradient-to-r from-emerald-600 to-green-600'
                      : motorStatus.label === 'drop_voltage'
                      ? 'bg-gradient-to-r from-red-600 to-orange-600'
                      : 'bg-gradient-to-r from-gray-600 to-slate-600'
                  }`}>MOTOR</span>
                </div>
                <div className="flex items-baseline space-x-1 md:space-x-2">
                  <span className={`text-2xl md:text-3xl font-bold ${
                    motorStatus.label === 'normal'
                      ? 'text-emerald-600'
                      : motorStatus.label === 'drop_voltage'
                      ? 'text-red-600'
                      : 'text-gray-600'
                  }`}>{motorStatus.status}</span>
                </div>
                <div className="mt-1 md:mt-2 flex items-center justify-between">
                  <span className="text-[10px] md:text-xs text-[#737491]">
                    {motorStatus.confidence > 0 ? `${(motorStatus.confidence * 100).toFixed(0)}%` : 'Voltage'}
                  </span>
                  <span className={`text-[10px] md:text-xs font-bold ${
                    motorStatus.voltage_stable ? 'text-emerald-600' : 'text-red-600'
                  }`}>
                    {motorStatus.voltage_stable ? '✓ Stable' : '✗ Unstable'}
                  </span>
                </div>
              </div>
            </div>

            {/* Runtime Info */}
            <div className="bg-gradient-to-br from-blue-100 via-cyan-100 to-sky-100 backdrop-blur-xl rounded-xl p-5 shadow-lg border-2 border-blue-300 hover:shadow-xl hover:scale-105 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-1">System Runtime</p>
                  <h2 className="text-3xl font-bold text-[#2c3e50]">
                    {isConnected || pollData.isConnected ? formatRuntime(runtime) : '--:--:--'}
                  </h2>
                </div>
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-md">
                  <Clock className="w-6 h-6 text-white" />
                </div>
              </div>
              <div className="mt-3 text-xs text-[#737491]">
                <span>{isConnected ? 'MQTT connected • Live tracking' : 'Waiting for MQTT connection'}</span>
              </div>
            </div>
          </div>
          </div>
        </div>
      </div>

      {/* Main Content - ESP32 Sensors Section */}
      <div className="px-4 md:px-6 pb-6 md:pb-10 pt-4 md:pt-6 relative z-20">
        <div className="max-w-[1800px] mx-auto">
          {/* Section Header */}
          <div className="mb-4 md:mb-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl md:text-3xl font-bold text-[#2c3e50] mb-1 md:mb-2">ESP32 Sensor Monitoring</h2>
              <p className="text-xs md:text-sm text-[#737491]">Real-time sensor data from ESP32 via MQTT broker</p>
            </div>
            <div className="flex items-center space-x-2 bg-white px-3 md:px-4 py-2 rounded-lg md:rounded-xl shadow-sm border border-gray-100">
              <Activity className="w-4 h-4 md:w-5 md:h-5 text-emerald-600" />
              <div>
                <p className="text-[10px] md:text-xs text-[#737491]">MQTT Status</p>
                <p className="text-sm md:text-lg font-bold text-[#2c3e50]">
                  {isConnected || pollData.isConnected ? '● Connected' : '○ Disconnected'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Sensor Cards Grid - 3 columns in 1 row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          
          {/* ADXL345 Card */}
          <div className="bg-gradient-to-br from-blue-100 via-white to-blue-50 rounded-2xl p-6 shadow-lg border-2 border-blue-300 hover:shadow-xl hover:scale-105 transition-all duration-300">
            <div className="flex items-center space-x-3 mb-5">
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-md">
                <Cpu className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-xl text-[#2c3e50]">ADXL345</h3>
                <p className="text-xs text-[#737491]">3-Axis Accelerometer</p>
              </div>
            </div>
            
            <div className="space-y-3">
              {/* Acceleration X */}
              <div className="bg-white rounded-xl p-4 shadow-sm border border-blue-200">
                <p className="text-xs font-bold text-blue-600 mb-2">Acceleration X</p>
                <div className="flex items-baseline space-x-2">
                  <span className="text-2xl font-bold text-[#2c3e50]">{sensors.adxl345.ax?.toFixed(2) || '0.00'}</span>
                  <span className="text-base font-semibold text-[#737491]">g</span>
                </div>
              </div>

              {/* Acceleration Y */}
              <div className="bg-white rounded-xl p-4 shadow-sm border border-blue-200">
                <p className="text-xs font-bold text-blue-600 mb-2">Acceleration Y</p>
                <div className="flex items-baseline space-x-2">
                  <span className="text-2xl font-bold text-[#2c3e50]">{sensors.adxl345.ay?.toFixed(2) || '0.00'}</span>
                  <span className="text-base font-semibold text-[#737491]">g</span>
                </div>
              </div>

              {/* Acceleration Z */}
              <div className="bg-white rounded-xl p-4 shadow-sm border border-blue-200">
                <p className="text-xs font-bold text-blue-600 mb-2">Acceleration Z</p>
                <div className="flex items-baseline space-x-2">
                  <span className="text-2xl font-bold text-[#2c3e50]">{sensors.adxl345.az?.toFixed(2) || '0.00'}</span>
                  <span className="text-base font-semibold text-[#737491]">g</span>
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center justify-between text-xs bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-3 border border-blue-200">
                <span className="text-[#737491] font-semibold">Status:</span>
                <span className="font-bold text-emerald-600">● Active</span>
              </div>
            </div>
          </div>

          {/* MPU6050 Card */}
          <div className="bg-gradient-to-br from-blue-100 via-white to-blue-50 rounded-2xl p-6 shadow-lg border-2 border-blue-300 hover:shadow-xl hover:scale-105 transition-all duration-300">
            <div className="flex items-center space-x-3 mb-5">
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-md">
                <Box className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-xl text-[#2c3e50]">MPU6050</h3>
                <p className="text-xs text-[#737491]">6-Axis IMU Sensor</p>
              </div>
            </div>
            
            <div className="space-y-3">
              {/* Accel X */}
              <div className="bg-white rounded-xl p-4 shadow-sm border border-blue-200">
                <p className="text-xs font-bold text-blue-600 mb-2">Accel X / Gyro X</p>
                <div className="flex items-baseline space-x-2">
                  <span className="text-2xl font-bold text-[#2c3e50]">{sensors.mpu6050.accel?.x?.toFixed(2) || '0.00'}</span>
                  <span className="text-sm text-[#737491]">m/s²</span>
                  <span className="text-sm text-[#737491]">/</span>
                  <span className="text-lg font-bold text-[#2c3e50]">{sensors.mpu6050.gyro?.x?.toFixed(3) || '0.000'}</span>
                  <span className="text-sm text-[#737491]">°/s</span>
                </div>
              </div>

              {/* Accel Y */}
              <div className="bg-white rounded-xl p-4 shadow-sm border border-blue-200">
                <p className="text-xs font-bold text-blue-600 mb-2">Accel Y / Gyro Y</p>
                <div className="flex items-baseline space-x-2">
                  <span className="text-2xl font-bold text-[#2c3e50]">{sensors.mpu6050.accel?.y?.toFixed(2) || '0.00'}</span>
                  <span className="text-sm text-[#737491]">m/s²</span>
                  <span className="text-sm text-[#737491]">/</span>
                  <span className="text-lg font-bold text-[#2c3e50]">{sensors.mpu6050.gyro?.y?.toFixed(3) || '0.000'}</span>
                  <span className="text-sm text-[#737491]">°/s</span>
                </div>
              </div>

              {/* Accel Z */}
              <div className="bg-white rounded-xl p-4 shadow-sm border border-blue-200">
                <p className="text-xs font-bold text-blue-600 mb-2">Accel Z / Gyro Z</p>
                <div className="flex items-baseline space-x-2">
                  <span className="text-2xl font-bold text-[#2c3e50]">{sensors.mpu6050.accel?.z?.toFixed(2) || '0.00'}</span>
                  <span className="text-sm text-[#737491]">m/s²</span>
                  <span className="text-sm text-[#737491]">/</span>
                  <span className="text-lg font-bold text-[#2c3e50]">{sensors.mpu6050.gyro?.z?.toFixed(3) || '0.000'}</span>
                  <span className="text-sm text-[#737491]">°/s</span>
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center justify-between text-xs bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-3 border border-blue-200">
                <span className="text-[#737491] font-semibold">Status:</span>
                <span className="font-bold text-emerald-600">● Active</span>
              </div>
            </div>
          </div>

          {/* BMP280 Card */}
          <div className="bg-gradient-to-br from-blue-100 via-white to-blue-50 rounded-2xl p-6 shadow-lg border-2 border-blue-300 hover:shadow-xl hover:scale-105 transition-all duration-300">
            <div className="flex items-center space-x-3 mb-5">
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-md">
                <GaugeIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-xl text-[#2c3e50]">BMP280</h3>
                <p className="text-xs text-[#737491]">Barometric Sensor</p>
              </div>
            </div>
            
            <div className="space-y-3">
              {/* Temperature */}
              <div className="bg-white rounded-xl p-4 shadow-sm border border-blue-200">
                <p className="text-xs font-bold text-blue-600 mb-2">Temperature</p>
                <div className="flex items-baseline space-x-2">
                  <span className="text-2xl font-bold text-[#2c3e50]">{sensors.bmp280.temp?.toFixed(2) || '0.00'}</span>
                  <span className="text-base font-semibold text-[#737491]">°C</span>
                </div>
              </div>

              {/* Pressure */}
              <div className="bg-white rounded-xl p-4 shadow-sm border border-blue-200">
                <p className="text-xs font-bold text-blue-600 mb-2">Pressure</p>
                <div className="flex items-baseline space-x-2">
                  <span className="text-2xl font-bold text-[#2c3e50]">{sensors.bmp280.pressure?.toFixed(2) || '0.00'}</span>
                  <span className="text-base font-semibold text-[#737491]">hPa</span>
                </div>
              </div>

              {/* Altitude */}
              <div className="bg-white rounded-xl p-4 shadow-sm border border-blue-200">
                <p className="text-xs font-bold text-blue-600 mb-2">Altitude</p>
                <div className="flex items-baseline space-x-2">
                  <span className="text-2xl font-bold text-[#2c3e50]">{sensors.bmp280.altitude?.toFixed(2) || '0.00'}</span>
                  <span className="text-base font-semibold text-[#737491]">m</span>
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center justify-between text-xs bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-3 border border-blue-200">
                <span className="text-[#737491] font-semibold">Status:</span>
                <span className="font-bold text-emerald-600">● Active</span>
              </div>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};

export default Overview;
