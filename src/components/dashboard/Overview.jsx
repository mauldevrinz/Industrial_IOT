import { useState, useEffect, useRef } from 'react';
import {
  Thermometer,
  Droplets,
  Gauge as GaugeIcon,
  Zap,
  TrendingUp,
  TrendingDown,
  Fan,
  Lightbulb,
  Wind,
  Activity,
  Clock
} from 'lucide-react';
import { useMultipleSensors } from '../../hooks/useSensorData';
import { useMQTT } from '../../hooks/useMQTT';
import { mqttConfig } from '../../config/mqtt.config';

const Overview = () => {
  const { temperature, humidity, pressure, co2 } = useMultipleSensors();
  const { isConnected, publish, subscribe } = useMQTT();

  // Runtime tracking
  const [runtime, setRuntime] = useState(0);
  const connectionStartTimeRef = useRef(null);

  // Track when MQTT connects
  useEffect(() => {
    if (isConnected && !connectionStartTimeRef.current) {
      connectionStartTimeRef.current = Date.now();
    } else if (!isConnected) {
      connectionStartTimeRef.current = null;
      setRuntime(0);
    }
  }, [isConnected]);

  // Update runtime every second
  useEffect(() => {
    if (!isConnected || !connectionStartTimeRef.current) return;

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - connectionStartTimeRef.current) / 1000);
      setRuntime(elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [isConnected]);

  // Format runtime as HH:MM:SS
  const formatRuntime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Aktuator states
  const [actuators, setActuators] = useState({
    motor: { status: true, power: 100, label: 'Main Motor', color: 'blue' },
    pump: { status: true, power: 100, label: 'Water Pump', color: 'cyan' },
    fan: { status: false, power: 0, label: 'Cooling Fan', color: 'purple' },
    heater: { status: true, power: 100, label: 'Heater', color: 'orange' },
    valve: { status: true, power: 100, label: 'Valve A1', color: 'emerald' },
    compressor: { status: false, power: 0, label: 'Compressor', color: 'indigo' }
  });

  // Subscribe to actuator status updates from MQTT
  useEffect(() => {
    if (!isConnected) return;

    // Subscribe to all actuator status updates
    const unsubscribeStatus = subscribe(mqttConfig.topics.actuator.status, (payload) => {
      console.log('Received actuator status update:', payload);
      if (payload && typeof payload === 'object') {
        setActuators(prev => {
          const updated = { ...prev };
          Object.keys(payload).forEach(key => {
            if (updated[key]) {
              updated[key] = {
                ...updated[key],
                status: payload[key].status,
                power: payload[key].status ? 100 : 0
              };
            }
          });
          return updated;
        });
      }
    });

    // Subscribe to individual actuator topics
    const unsubscribers = Object.keys(actuators).map(key => {
      return subscribe(mqttConfig.topics.actuator[key], (payload) => {
        console.log(`Received ${key} update:`, payload);
        if (payload && typeof payload.status === 'boolean') {
          setActuators(prev => ({
            ...prev,
            [key]: {
              ...prev[key],
              status: payload.status,
              power: payload.status ? 100 : 0
            }
          }));
        }
      });
    });

    return () => {
      if (unsubscribeStatus) unsubscribeStatus();
      unsubscribers.forEach(unsub => unsub && unsub());
    };
  }, [isConnected, subscribe]);

  const toggleActuator = (key) => {
    const newStatus = !actuators[key].status;
    const newPower = newStatus ? 100 : 0;

    // Update local state immediately for responsive UI
    setActuators(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        status: newStatus,
        power: newPower
      }
    }));

    // Publish to MQTT
    if (isConnected && publish) {
      const payload = {
        status: newStatus,
        power: newPower,
        timestamp: new Date().toISOString()
      };

      console.log(`Publishing to ${mqttConfig.topics.actuator[key]}:`, payload);
      publish(mqttConfig.topics.actuator[key], payload, mqttConfig.qos.default);
    }
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
              {/* Temperature Card */}
              <div className="bg-gradient-to-br from-blue-100 via-cyan-100 to-sky-100 backdrop-blur-xl rounded-lg md:rounded-xl p-3 md:p-4 shadow-lg border-2 border-blue-300 hover:shadow-xl hover:scale-105 transition-all duration-300">
                <div className="flex items-center space-x-2 md:space-x-3 mb-2 md:mb-3">
                  <div className="p-1.5 md:p-2.5 rounded-lg md:rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-md">
                    <Thermometer className="w-4 h-4 md:w-5 md:h-5 text-white" />
                  </div>
                  <span className="text-[10px] md:text-xs font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">TEMP</span>
                </div>
                <div className="flex items-baseline space-x-1 md:space-x-2">
                  <span className="text-2xl md:text-3xl font-bold text-[#2c3e50]">{temperature.current.toFixed(1)}</span>
                  <span className="text-sm md:text-lg font-semibold text-[#737491]">°C</span>
                </div>
                <div className="mt-1 md:mt-2 flex items-center justify-between">
                  <span className="text-[10px] md:text-xs text-[#737491]">Avg</span>
                  <span className="text-[10px] md:text-xs font-bold text-emerald-600 flex items-center">
                    <TrendingUp className="w-2 h-2 md:w-3 md:h-3 mr-0.5 md:mr-1" />
                    {Math.abs(calculateTrend(temperature.history)).toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Humidity Card */}
              <div className="bg-gradient-to-br from-blue-100 via-cyan-100 to-sky-100 backdrop-blur-xl rounded-xl p-4 shadow-lg border-2 border-blue-300 hover:shadow-xl hover:scale-105 transition-all duration-300">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-md">
                    <Droplets className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xs font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">HUMIDITY</span>
                </div>
                <div className="flex items-baseline space-x-2">
                  <span className="text-3xl font-bold text-[#2c3e50]">{humidity.current.toFixed(0)}</span>
                  <span className="text-lg font-semibold text-[#737491]">%</span>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs text-[#737491]">38 (Good)</span>
                  <span className="text-xs font-bold text-emerald-600 flex items-center">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    {Math.abs(calculateTrend(humidity.history)).toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Pressure Card */}
              <div className="bg-gradient-to-br from-blue-100 via-cyan-100 to-sky-100 backdrop-blur-xl rounded-xl p-4 shadow-lg border-2 border-blue-300 hover:shadow-xl hover:scale-105 transition-all duration-300">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-md">
                    <GaugeIcon className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xs font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">PRESSURE</span>
                </div>
                <div className="flex items-baseline space-x-2">
                  <span className="text-3xl font-bold text-[#2c3e50]">{pressure.current.toFixed(1)}</span>
                  <span className="text-lg font-semibold text-[#737491]">bar</span>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs text-[#737491]">Slightly dry</span>
                  <span className="text-xs font-bold text-red-600 flex items-center">
                    <TrendingDown className="w-3 h-3 mr-1" />
                    {Math.abs(calculateTrend(pressure.history)).toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* CO2 Card */}
              <div className="bg-gradient-to-br from-blue-100 via-cyan-100 to-sky-100 backdrop-blur-xl rounded-xl p-4 shadow-lg border-2 border-blue-300 hover:shadow-xl hover:scale-105 transition-all duration-300">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-md">
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xs font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">CO2 GAS</span>
                </div>
                <div className="flex items-baseline space-x-2">
                  <span className="text-3xl font-bold text-[#2c3e50]">{co2.current.toFixed(1)}</span>
                  <span className="text-lg font-semibold text-[#737491]">ppm</span>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs text-[#737491]">Normal range</span>
                  <span className="text-xs font-bold text-emerald-600 flex items-center">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    {Math.abs(calculateTrend(co2.history)).toFixed(1)}%
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
                    {isConnected ? formatRuntime(runtime) : '--:--:--'}
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

      {/* Main Content - Aktuator Status Section */}
      <div className="px-4 md:px-6 pb-6 md:pb-10 pt-4 md:pt-6 relative z-20">
        <div className="max-w-[1800px] mx-auto">
          {/* Section Header */}
          <div className="mb-4 md:mb-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl md:text-3xl font-bold text-[#2c3e50] mb-1 md:mb-2">Actuator Control Center</h2>
              <p className="text-xs md:text-sm text-[#737491]">Monitor and control all industrial actuators in real-time</p>
            </div>
            <div className="flex items-center space-x-2 bg-white px-3 md:px-4 py-2 rounded-lg md:rounded-xl shadow-sm border border-gray-100">
              <Activity className="w-4 h-4 md:w-5 md:h-5 text-emerald-600" />
              <div>
                <p className="text-[10px] md:text-xs text-[#737491]">Active Actuators</p>
                <p className="text-sm md:text-lg font-bold text-[#2c3e50]">
                  {Object.values(actuators).filter(a => a.status).length}/{Object.keys(actuators).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Actuator Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Main Motor */}
          <div className={`relative overflow-hidden bg-gradient-to-br ${actuators.motor.status ? 'from-blue-50 to-blue-100' : 'from-gray-50 to-gray-100'} rounded-2xl p-6 shadow-lg border-2 ${actuators.motor.status ? 'border-blue-200' : 'border-gray-200'} transition-all duration-300`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className={`p-3 rounded-xl ${actuators.motor.status ? 'bg-blue-500' : 'bg-gray-400'} transition-all duration-300`}>
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-[#2c3e50]">{actuators.motor.label}</h3>
                  <p className="text-xs text-[#737491]">AC Motor 3-Phase</p>
                </div>
              </div>
              <button
                onClick={() => toggleActuator('motor')}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${actuators.motor.status ? 'bg-blue-600' : 'bg-gray-300'}`}
              >
                <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${actuators.motor.status ? 'translate-x-7' : 'translate-x-1'}`} />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-[#737491]">Power Output</span>
                <span className={`text-2xl font-bold ${actuators.motor.status ? 'text-blue-600' : 'text-gray-400'}`}>
                  {actuators.motor.status ? 'ON' : 'OFF'}
                </span>
              </div>
              <div className="w-full h-3 bg-white rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${actuators.motor.status ? 'bg-gradient-to-r from-blue-500 to-blue-600' : 'bg-gray-300'}`}
                  style={{ width: `${actuators.motor.power}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#737491]">Status:</span>
                <span className={`font-bold ${actuators.motor.status ? 'text-emerald-600' : 'text-red-600'}`}>
                  {actuators.motor.status ? '● RUNNING' : '○ STOPPED'}
                </span>
              </div>
            </div>
          </div>

          {/* Water Pump */}
          <div className={`relative overflow-hidden bg-gradient-to-br ${actuators.pump.status ? 'from-cyan-50 to-cyan-100' : 'from-gray-50 to-gray-100'} rounded-2xl p-6 shadow-lg border-2 ${actuators.pump.status ? 'border-cyan-200' : 'border-gray-200'} transition-all duration-300`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className={`p-3 rounded-xl ${actuators.pump.status ? 'bg-cyan-500' : 'bg-gray-400'} transition-all duration-300`}>
                  <Droplets className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-[#2c3e50]">{actuators.pump.label}</h3>
                  <p className="text-xs text-[#737491]">Centrifugal Pump</p>
                </div>
              </div>
              <button
                onClick={() => toggleActuator('pump')}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${actuators.pump.status ? 'bg-cyan-600' : 'bg-gray-300'}`}
              >
                <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${actuators.pump.status ? 'translate-x-7' : 'translate-x-1'}`} />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-[#737491]">Flow Rate</span>
                <span className={`text-2xl font-bold ${actuators.pump.status ? 'text-cyan-600' : 'text-gray-400'}`}>
                  {actuators.pump.status ? 'ON' : 'OFF'}
                </span>
              </div>
              <div className="w-full h-3 bg-white rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${actuators.pump.status ? 'bg-gradient-to-r from-cyan-500 to-cyan-600' : 'bg-gray-300'}`}
                  style={{ width: `${actuators.pump.power}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#737491]">Status:</span>
                <span className={`font-bold ${actuators.pump.status ? 'text-emerald-600' : 'text-red-600'}`}>
                  {actuators.pump.status ? '● RUNNING' : '○ STOPPED'}
                </span>
              </div>
            </div>
          </div>

          {/* Cooling Fan */}
          <div className={`relative overflow-hidden bg-gradient-to-br ${actuators.fan.status ? 'from-purple-50 to-purple-100' : 'from-gray-50 to-gray-100'} rounded-2xl p-6 shadow-lg border-2 ${actuators.fan.status ? 'border-purple-200' : 'border-gray-200'} transition-all duration-300`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className={`p-3 rounded-xl ${actuators.fan.status ? 'bg-purple-500' : 'bg-gray-400'} transition-all duration-300`}>
                  <Fan className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-[#2c3e50]">{actuators.fan.label}</h3>
                  <p className="text-xs text-[#737491]">Industrial Fan</p>
                </div>
              </div>
              <button
                onClick={() => toggleActuator('fan')}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${actuators.fan.status ? 'bg-purple-600' : 'bg-gray-300'}`}
              >
                <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${actuators.fan.status ? 'translate-x-7' : 'translate-x-1'}`} />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-[#737491]">Speed</span>
                <span className={`text-2xl font-bold ${actuators.fan.status ? 'text-purple-600' : 'text-gray-400'}`}>
                  {actuators.fan.status ? 'ON' : 'OFF'}
                </span>
              </div>
              <div className="w-full h-3 bg-white rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${actuators.fan.status ? 'bg-gradient-to-r from-purple-500 to-purple-600' : 'bg-gray-300'}`}
                  style={{ width: `${actuators.fan.power}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#737491]">Status:</span>
                <span className={`font-bold ${actuators.fan.status ? 'text-emerald-600' : 'text-red-600'}`}>
                  {actuators.fan.status ? '● RUNNING' : '○ STOPPED'}
                </span>
              </div>
            </div>
          </div>

          {/* Heater */}
          <div className={`relative overflow-hidden bg-gradient-to-br ${actuators.heater.status ? 'from-orange-50 to-orange-100' : 'from-gray-50 to-gray-100'} rounded-2xl p-6 shadow-lg border-2 ${actuators.heater.status ? 'border-orange-200' : 'border-gray-200'} transition-all duration-300`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className={`p-3 rounded-xl ${actuators.heater.status ? 'bg-orange-500' : 'bg-gray-400'} transition-all duration-300`}>
                  <Lightbulb className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-[#2c3e50]">{actuators.heater.label}</h3>
                  <p className="text-xs text-[#737491]">Electric Heater</p>
                </div>
              </div>
              <button
                onClick={() => toggleActuator('heater')}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${actuators.heater.status ? 'bg-orange-600' : 'bg-gray-300'}`}
              >
                <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${actuators.heater.status ? 'translate-x-7' : 'translate-x-1'}`} />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-[#737491]">Temperature</span>
                <span className={`text-2xl font-bold ${actuators.heater.status ? 'text-orange-600' : 'text-gray-400'}`}>
                  {actuators.heater.status ? 'ON' : 'OFF'}
                </span>
              </div>
              <div className="w-full h-3 bg-white rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${actuators.heater.status ? 'bg-gradient-to-r from-orange-500 to-orange-600' : 'bg-gray-300'}`}
                  style={{ width: `${actuators.heater.power}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#737491]">Status:</span>
                <span className={`font-bold ${actuators.heater.status ? 'text-emerald-600' : 'text-red-600'}`}>
                  {actuators.heater.status ? '● RUNNING' : '○ STOPPED'}
                </span>
              </div>
            </div>
          </div>

          {/* Valve */}
          <div className={`relative overflow-hidden bg-gradient-to-br ${actuators.valve.status ? 'from-emerald-50 to-emerald-100' : 'from-gray-50 to-gray-100'} rounded-2xl p-6 shadow-lg border-2 ${actuators.valve.status ? 'border-emerald-200' : 'border-gray-200'} transition-all duration-300`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className={`p-3 rounded-xl ${actuators.valve.status ? 'bg-emerald-500' : 'bg-gray-400'} transition-all duration-300`}>
                  <GaugeIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-[#2c3e50]">{actuators.valve.label}</h3>
                  <p className="text-xs text-[#737491]">Control Valve</p>
                </div>
              </div>
              <button
                onClick={() => toggleActuator('valve')}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${actuators.valve.status ? 'bg-emerald-600' : 'bg-gray-300'}`}
              >
                <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${actuators.valve.status ? 'translate-x-7' : 'translate-x-1'}`} />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-[#737491]">Opening</span>
                <span className={`text-2xl font-bold ${actuators.valve.status ? 'text-emerald-600' : 'text-gray-400'}`}>
                  {actuators.valve.status ? 'ON' : 'OFF'}
                </span>
              </div>
              <div className="w-full h-3 bg-white rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${actuators.valve.status ? 'bg-gradient-to-r from-emerald-500 to-emerald-600' : 'bg-gray-300'}`}
                  style={{ width: `${actuators.valve.power}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#737491]">Status:</span>
                <span className={`font-bold ${actuators.valve.status ? 'text-emerald-600' : 'text-red-600'}`}>
                  {actuators.valve.status ? '● OPEN' : '○ CLOSED'}
                </span>
              </div>
            </div>
          </div>

          {/* Compressor */}
          <div className={`relative overflow-hidden bg-gradient-to-br ${actuators.compressor.status ? 'from-indigo-50 to-indigo-100' : 'from-gray-50 to-gray-100'} rounded-2xl p-6 shadow-lg border-2 ${actuators.compressor.status ? 'border-indigo-200' : 'border-gray-200'} transition-all duration-300`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className={`p-3 rounded-xl ${actuators.compressor.status ? 'bg-indigo-500' : 'bg-gray-400'} transition-all duration-300`}>
                  <Wind className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-[#2c3e50]">{actuators.compressor.label}</h3>
                  <p className="text-xs text-[#737491]">Air Compressor</p>
                </div>
              </div>
              <button
                onClick={() => toggleActuator('compressor')}
                className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${actuators.compressor.status ? 'bg-indigo-600' : 'bg-gray-300'}`}
              >
                <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${actuators.compressor.status ? 'translate-x-7' : 'translate-x-1'}`} />
              </button>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-[#737491]">Pressure</span>
                <span className={`text-2xl font-bold ${actuators.compressor.status ? 'text-indigo-600' : 'text-gray-400'}`}>
                  {actuators.compressor.status ? 'ON' : 'OFF'}
                </span>
              </div>
              <div className="w-full h-3 bg-white rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${actuators.compressor.status ? 'bg-gradient-to-r from-indigo-500 to-indigo-600' : 'bg-gray-300'}`}
                  style={{ width: `${actuators.compressor.power}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#737491]">Status:</span>
                <span className={`font-bold ${actuators.compressor.status ? 'text-emerald-600' : 'text-red-600'}`}>
                  {actuators.compressor.status ? '● RUNNING' : '○ STOPPED'}
                </span>
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
