import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Download, RefreshCw, Thermometer, Droplets, Wind, Zap, TrendingUp, TrendingDown, Activity, X, Database, Settings, Cpu, Box, Gauge as GaugeIcon } from 'lucide-react';
import { useMultipleSensors } from '../../hooks/useSensorData';
import { useMQTT } from '../../hooks/useMQTT';
import { useMQTTPolling } from '../../hooks/useMQTTPolling';
import { useSensorContext } from '../../context/SensorContext';

const Data = () => {
  const { temperature, level, pressure, co2 } = useMultipleSensors();
  const { isConnected, subscribe } = useMQTT();
  const pollData = useMQTTPolling(1000); // Poll every 1 second
  const { sensorHistory, setSensorHistory, addDataPoint, MAX_HISTORY } = useSensorContext();
  const [selectedSensor, setSelectedSensor] = useState('adxl345'); // Sensor dropdown
  const [selectedParameter, setSelectedParameter] = useState('ax'); // Parameter button
  const [showExportModal, setShowExportModal] = useState(false);

  // Subscribe to ESP32 sensors via MQTT (WebSocket)
  useEffect(() => {
    if (!isConnected) return;

    const handleADXL = (payload) => {
      if (payload?.ax !== undefined) {
        addDataPoint('adxl345', 'ax', payload.ax);
        addDataPoint('adxl345', 'ay', payload.ay);
        addDataPoint('adxl345', 'az', payload.az);
      }
    };

    const handleMPU = (payload) => {
      if (payload?.accel?.x !== undefined) {
        addDataPoint('mpu6050', 'accel_x', payload.accel.x);
        addDataPoint('mpu6050', 'accel_y', payload.accel.y);
        addDataPoint('mpu6050', 'accel_z', payload.accel.z);
        addDataPoint('mpu6050', 'gyro_x', payload.gyro.x);
        addDataPoint('mpu6050', 'gyro_y', payload.gyro.y);
        addDataPoint('mpu6050', 'gyro_z', payload.gyro.z);
      }
    };

    const handleBMP = (payload) => {
      if (payload?.temp !== undefined) {
        addDataPoint('bmp280', 'temp', payload.temp);
        addDataPoint('bmp280', 'pressure', payload.pressure);
        addDataPoint('bmp280', 'altitude', payload.altitude);
      }
    };

    subscribe('iiot/sensors/adxl345', handleADXL);
    subscribe('iiot/sensors/mpu6050', handleMPU);
    subscribe('iiot/sensors/bmp280', handleBMP);
  }, [isConnected, subscribe]);

  // Fallback: Sync polling data when WebSocket not connected
  useEffect(() => {
    if (!pollData.isConnected || isConnected) return; // Only use polling as fallback

    const sensorData = pollData.sensorData;
    
    if (sensorData?.adxl345) {
      addDataPoint('adxl345', 'ax', sensorData.adxl345.ax);
      addDataPoint('adxl345', 'ay', sensorData.adxl345.ay);
      addDataPoint('adxl345', 'az', sensorData.adxl345.az);
    }
    
    if (sensorData?.mpu6050?.accel) {
      addDataPoint('mpu6050', 'accel_x', sensorData.mpu6050.accel.x);
      addDataPoint('mpu6050', 'accel_y', sensorData.mpu6050.accel.y);
      addDataPoint('mpu6050', 'accel_z', sensorData.mpu6050.accel.z);
      addDataPoint('mpu6050', 'gyro_x', sensorData.mpu6050.gyro.x);
      addDataPoint('mpu6050', 'gyro_y', sensorData.mpu6050.gyro.y);
      addDataPoint('mpu6050', 'gyro_z', sensorData.mpu6050.gyro.z);
    }
    
    if (sensorData?.bmp280) {
      addDataPoint('bmp280', 'temp', sensorData.bmp280.temp);
      addDataPoint('bmp280', 'pressure', sensorData.bmp280.pressure);
      addDataPoint('bmp280', 'altitude', sensorData.bmp280.altitude);
    }
  }, [pollData.sensorData, isConnected, pollData.isConnected]);

  // Data Management Settings
  const [dataSettings, setDataSettings] = useState({
    dataRetention: 30,
    sampleRate: 1000,
    autoExport: false,
    exportFormat: 'csv',
  });

  const handleDataChange = (field, value) => {
    setDataSettings(prev => ({ ...prev, [field]: value }));
  };

  const getChartData = () => {
    // Get data from selected sensor and parameter
    const data = sensorHistory[selectedSensor]?.[selectedParameter] || [];
    
    if (data.length === 0) {
      return [{
        time: new Date().toLocaleTimeString(),
        value: 0
      }];
    }

    return data.map((item) => ({
      time: new Date(item.timestamp).toLocaleTimeString(),
      value: item.value
    }));
  };

  const exportData = () => {
    const data = getChartData();
    let content, mimeType, extension;

    if (dataSettings.exportFormat === 'csv') {
      content = [
        ['Time', 'Value'],
        ...data.map(row => [row.time, row.value])
      ].map(e => e.join(',')).join('\n');
      mimeType = 'text/csv';
      extension = 'csv';
    } else if (dataSettings.exportFormat === 'json') {
      content = JSON.stringify(data, null, 2);
      mimeType = 'application/json';
      extension = 'json';
    } else {
      // Excel format (simplified as CSV for now)
      content = [
        ['Time', 'Value'],
        ...data.map(row => [row.time, row.value])
      ].map(e => e.join(',')).join('\n');
      mimeType = 'text/csv';
      extension = 'csv';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedMetric}_data_${new Date().toISOString()}.${extension}`;
    a.click();
    setShowExportModal(false);
  };

  // ESP32 Sensor definitions
  const esp32Sensors = {
    adxl345: {
      id: 'adxl345',
      name: 'ADXL345',
      description: '3-Axis Accelerometer',
      color: '#3b82f6',
      gradient: 'from-blue-500 to-cyan-500',
      icon: Cpu,
      bg: 'from-blue-50 to-cyan-50',
      darkBg: 'from-blue-500 to-cyan-500',
      parameters: [
        { id: 'ax', name: 'Acceleration X', unit: 'g' },
        { id: 'ay', name: 'Acceleration Y', unit: 'g' },
        { id: 'az', name: 'Acceleration Z', unit: 'g' }
      ]
    },
    mpu6050: {
      id: 'mpu6050',
      name: 'MPU6050',
      description: '6-Axis IMU Sensor',
      color: '#10b981',
      gradient: 'from-emerald-500 to-teal-500',
      icon: Box,
      bg: 'from-emerald-50 to-teal-50',
      darkBg: 'from-emerald-500 to-teal-500',
      parameters: [
        { id: 'accel_x', name: 'Accel X', unit: 'm/s²' },
        { id: 'accel_y', name: 'Accel Y', unit: 'm/s²' },
        { id: 'accel_z', name: 'Accel Z', unit: 'm/s²' },
        { id: 'gyro_x', name: 'Gyro X', unit: '°/s' },
        { id: 'gyro_y', name: 'Gyro Y', unit: '°/s' },
        { id: 'gyro_z', name: 'Gyro Z', unit: '°/s' }
      ]
    },
    bmp280: {
      id: 'bmp280',
      name: 'BMP280',
      description: 'Barometric Sensor',
      color: '#f97316',
      gradient: 'from-orange-500 to-red-500',
      icon: GaugeIcon,
      bg: 'from-orange-50 to-red-50',
      darkBg: 'from-orange-500 to-red-500',
      parameters: [
        { id: 'temp', name: 'Temperature', unit: '°C' },
        { id: 'pressure', name: 'Pressure', unit: 'hPa' },
        { id: 'altitude', name: 'Altitude', unit: 'm' }
      ]
    }
  };

  const currentSensor = esp32Sensors[selectedSensor];
  const currentParam = currentSensor.parameters.find(p => p.id === selectedParameter) || currentSensor.parameters[0];

  const chartData = getChartData();
  const latestValue = chartData[chartData.length - 1]?.value || 0;
  const previousValue = chartData[chartData.length - 2]?.value || 0;
  const change = previousValue !== 0 ? ((latestValue - previousValue) / previousValue * 100).toFixed(1) : 0;

  // Calculate statistics
  const values = chartData.map(d => d.value);
  const maxValue = values.length > 0 ? Math.max(...values) : 0;
  const minValue = values.length > 0 ? Math.min(...values) : 0;
  const avgValue = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 rounded-xl shadow-xl border-2 border-gray-200">
          <p className="font-semibold text-gray-700 text-xs mb-1">{payload[0].payload.time}</p>
          <p className={`text-xl font-bold bg-gradient-to-r ${currentSensor.gradient} bg-clip-text text-transparent`}>
            {payload[0].value.toFixed(3)} {currentParam.unit}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      <div className="p-4 md:p-6">

        {/* Header Section */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">ESP32 Sensor Data Monitoring</h1>
              <p className="text-gray-600">Real-time ESP32 sensor data visualization via MQTT</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => window.location.reload()}
                className="flex items-center space-x-2 px-4 py-2.5 bg-white text-gray-700 rounded-xl hover:bg-gray-50 transition shadow-md hover:shadow-lg font-semibold border border-gray-200"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Refresh</span>
              </button>
              <button
                onClick={() => setShowExportModal(true)}
                className={`flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r ${currentSensor.gradient} text-white rounded-xl hover:shadow-lg transition font-semibold`}
              >
                <Download className="w-4 h-4" />
                <span>Export Data</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Layout - 2 Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

          {/* Column 1 - Current Value & Sensor Selector */}
          <div className="lg:col-span-1 space-y-6">

            {/* Current Value Card */}
            <div className={`bg-gradient-to-br ${currentSensor.darkBg} rounded-2xl p-6 shadow-xl relative overflow-hidden`}>
              {/* Decorative background */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>

              <div className="relative z-10">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                    <currentSensor.icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-white/80 text-sm font-medium">Current Reading</p>
                    <p className="text-white text-lg font-bold">{currentParam.name}</p>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex items-baseline space-x-2">
                    <span className="text-6xl font-bold text-white">
                      {latestValue.toFixed(2)}
                    </span>
                    <span className="text-3xl font-semibold text-white/80">{currentParam.unit}</span>
                  </div>
                </div>

                <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${change >= 0 ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
                  {change >= 0 ? (
                    <TrendingUp className="w-4 h-4 text-white" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-white" />
                  )}
                  <span className="text-sm font-semibold text-white">
                    {change >= 0 ? '+' : ''}{change}% from previous
                  </span>
                </div>
              </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white rounded-xl p-4 shadow-md">
                <p className="text-xs text-gray-500 mb-1 font-medium">Maximum</p>
                <p className={`text-xl font-bold bg-gradient-to-r ${currentSensor.gradient} bg-clip-text text-transparent`}>
                  {maxValue.toFixed(2)}
                </p>
                <p className="text-xs text-gray-400">{currentParam.unit}</p>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-md">
                <p className="text-xs text-gray-500 mb-1 font-medium">Average</p>
                <p className={`text-xl font-bold bg-gradient-to-r ${currentSensor.gradient} bg-clip-text text-transparent`}>
                  {avgValue.toFixed(2)}
                </p>
                <p className="text-xs text-gray-400">{currentParam.unit}</p>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-md">
                <p className="text-xs text-gray-500 mb-1 font-medium">Minimum</p>
                <p className={`text-xl font-bold bg-gradient-to-r ${currentSensor.gradient} bg-clip-text text-transparent`}>
                  {minValue.toFixed(2)}
                </p>
                <p className="text-xs text-gray-400">{currentParam.unit}</p>
              </div>
            </div>

            {/* Sensor Selector */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Activity className="w-5 h-5 text-gray-700" />
                <h2 className="text-lg font-bold text-gray-900">Select Sensor</h2>
              </div>
              
              {/* Sensor Dropdown */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  ESP32 Sensor
                </label>
                <select
                  value={selectedSensor}
                  onChange={(e) => {
                    setSelectedSensor(e.target.value);
                    setSelectedParameter(esp32Sensors[e.target.value].parameters[0].id);
                  }}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition font-semibold"
                >
                  {Object.values(esp32Sensors).map((sensor) => (
                    <option key={sensor.id} value={sensor.id}>
                      {sensor.name} - {sensor.description}
                    </option>
                  ))}
                </select>
              </div>

              {/* Parameter Buttons */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Parameter
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {currentSensor.parameters.map((param) => {
                    const isSelected = selectedParameter === param.id;
                    return (
                      <button
                        key={param.id}
                        onClick={() => setSelectedParameter(param.id)}
                        className={`w-full p-3 rounded-xl border-2 transition-all duration-300 font-semibold text-sm ${
                          isSelected
                            ? `border-transparent bg-gradient-to-r ${currentSensor.gradient} text-white shadow-lg`
                            : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md text-gray-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span>{param.name}</span>
                          <span className={`text-xs ${isSelected ? 'text-white/80' : 'text-gray-500'}`}>
                            {param.unit}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Column 2 - Trend Chart */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-6 h-full flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {currentSensor.name} - {currentParam.name}
                  </h2>
                  <p className="text-gray-500 text-sm">Real-time data visualization</p>
                </div>
                <div className={`px-4 py-2 rounded-lg bg-gradient-to-r ${currentSensor.bg}`}>
                  <span className={`text-sm font-bold bg-gradient-to-r ${currentSensor.gradient} bg-clip-text text-transparent`}>
                    {chartData.length} data points
                  </span>
                </div>
              </div>

              <div className="flex-1 min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={currentSensor.color} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={currentSensor.color} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="time"
                    stroke="#6b7280"
                    style={{ fontSize: '12px', fontWeight: 500 }}
                  />
                  <YAxis
                    stroke="#6b7280"
                    style={{ fontSize: '12px', fontWeight: 500 }}
                    domain={['auto', 'auto']}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke={currentSensor.color}
                    strokeWidth={3}
                    fill="url(#colorValue)"
                    dot={{ r: 4, fill: currentSensor.color, strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 6, strokeWidth: 2 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Readings - {currentParam.name}</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className={`bg-gradient-to-r ${currentSensor.bg}`}>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider rounded-tl-lg">
                    Timestamp
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                    Value
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider">
                    Unit
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider rounded-tr-lg">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {chartData.length > 0 ? (
                  chartData.slice(-10).reverse().map((row, index) => (
                    <tr key={index} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {row.time}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-lg font-bold bg-gradient-to-r ${currentSensor.gradient} bg-clip-text text-transparent`}>
                          {row.value.toFixed(3)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-medium">
                        {currentParam.unit}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-emerald-100 text-emerald-800">
                          Normal
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="px-6 py-12 text-center">
                      <div className="text-gray-400">
                        <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p className="text-lg font-semibold">No data available yet</p>
                        <p className="text-sm">Waiting for ESP32 sensor data from MQTT...</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Export Modal */}
        {showExportModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="sticky top-0 bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-6 rounded-t-2xl flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Database className="w-6 h-6" />
                  <div>
                    <h2 className="text-xl font-bold">Data Export Settings</h2>
                    <p className="text-sm text-blue-100">Configure export options and data management</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowExportModal(false)}
                  className="p-2 hover:bg-white/20 rounded-lg transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-6">
                {/* Export Settings */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                    <Download className="w-5 h-5 mr-2 text-blue-600" />
                    Export Configuration
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Export Format
                      </label>
                      <select
                        value={dataSettings.exportFormat}
                        onChange={(e) => handleDataChange('exportFormat', e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                      >
                        <option value="csv">CSV (Comma-separated)</option>
                        <option value="json">JSON (JavaScript Object)</option>
                        <option value="excel">Excel (Spreadsheet)</option>
                      </select>
                    </div>

                    <div className="flex items-end">
                      <SettingToggle
                        label="Auto Export"
                        description="Automatically export data daily"
                        checked={dataSettings.autoExport}
                        onChange={() => handleDataChange('autoExport', !dataSettings.autoExport)}
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t-2 border-gray-100"></div>

                {/* Data Management */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                    <Settings className="w-5 h-5 mr-2 text-purple-600" />
                    Data Management
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Data Retention (days)
                      </label>
                      <input
                        type="number"
                        value={dataSettings.dataRetention}
                        onChange={(e) => handleDataChange('dataRetention', parseInt(e.target.value))}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                        placeholder="30"
                      />
                      <p className="text-xs text-gray-500 mt-1">How long to keep historical data</p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Sample Rate (ms)
                      </label>
                      <input
                        type="number"
                        value={dataSettings.sampleRate}
                        onChange={(e) => handleDataChange('sampleRate', parseInt(e.target.value))}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                        placeholder="1000"
                      />
                      <p className="text-xs text-gray-500 mt-1">Data collection frequency</p>
                    </div>
                  </div>
                </div>

                {/* Current Selection Info */}
                <div className={`bg-gradient-to-r ${currentSensor.bg} border-2 rounded-xl p-4`}>
                  <h4 className="font-semibold text-gray-900 mb-2">Current Selection</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-600">Sensor:</span>
                      <span className={`ml-2 font-bold bg-gradient-to-r ${currentSensor.gradient} bg-clip-text text-transparent`}>
                        {currentSensor.name} - {currentParam.name}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Data Points:</span>
                      <span className="ml-2 font-bold text-gray-900">{chartData.length}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Format:</span>
                      <span className="ml-2 font-bold text-gray-900">{dataSettings.exportFormat.toUpperCase()}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">File Size:</span>
                      <span className="ml-2 font-bold text-gray-900">~{Math.ceil(chartData.length * 0.05)}KB</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="sticky bottom-0 bg-gray-50 px-6 py-4 rounded-b-2xl flex justify-end space-x-3 border-t-2 border-gray-100">
                <button
                  onClick={() => setShowExportModal(false)}
                  className="px-6 py-3 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={exportData}
                  className={`flex items-center space-x-2 px-6 py-3 bg-gradient-to-r ${currentSensor.gradient} text-white rounded-xl hover:shadow-lg transition font-semibold`}
                >
                  <Download className="w-5 h-5" />
                  <span>Export Now</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const SettingToggle = ({ label, description, checked, onChange }) => {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-gray-900 text-sm">{label}</h3>
          <p className="text-xs text-gray-500">{description}</p>
        </div>
        <button
          onClick={onChange}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors shadow-inner ${
            checked ? 'bg-blue-600' : 'bg-gray-300'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform ${
              checked ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
    </div>
  );
};

export default Data;
