import React, { useState } from 'react';
import { Power, RotateCw, AlertCircle, CheckCircle2, PlayCircle, StopCircle, Pause } from 'lucide-react';
import { useMQTT } from '../../hooks/useMQTT';
import { mqttConfig } from '../../config/mqtt.config';

const Control = () => {
  const { publish, isConnected } = useMQTT();
  const [devices, setDevices] = useState([
    { id: 1, name: 'Motor A', status: 'off', type: 'motor', speed: 0 },
    { id: 2, name: 'Motor B', status: 'running', type: 'motor', speed: 75 },
    { id: 3, name: 'Valve 1', status: 'open', type: 'valve', position: 100 },
    { id: 4, name: 'Valve 2', status: 'closed', type: 'valve', position: 0 },
    { id: 5, name: 'Pump A', status: 'running', type: 'pump', flow: 85 },
    { id: 6, name: 'Pump B', status: 'off', type: 'pump', flow: 0 },
  ]);

  const sendCommand = (deviceId, command, value = null) => {
    const payload = {
      device_id: deviceId,
      command: command,
      value: value,
      timestamp: Date.now()
    };

    publish(mqttConfig.topics.command, payload);

    // Update local state (in real app, this would come from MQTT response)
    setDevices(devices.map(device => {
      if (device.id === deviceId) {
        if (command === 'START') return { ...device, status: 'running' };
        if (command === 'STOP') return { ...device, status: 'off' };
        if (command === 'OPEN') return { ...device, status: 'open', position: 100 };
        if (command === 'CLOSE') return { ...device, status: 'closed', position: 0 };
      }
      return device;
    }));
  };

  const handleSpeedChange = (deviceId, speed) => {
    setDevices(devices.map(device =>
      device.id === deviceId ? { ...device, speed: parseInt(speed) } : device
    ));
  };

  const applySpeedChange = (deviceId) => {
    const device = devices.find(d => d.id === deviceId);
    sendCommand(deviceId, 'SET_SPEED', device.speed);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent mb-2">
              Device Control
            </h1>
            <p className="text-gray-600">Remote control and monitoring of industrial devices</p>
          </div>
          <div className={`flex items-center space-x-3 px-5 py-3 rounded-xl shadow-md ${
            isConnected ? 'bg-emerald-50 border-2 border-emerald-200' : 'bg-red-50 border-2 border-red-200'
          }`}>
            <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></div>
            <span className={`text-sm font-semibold ${isConnected ? 'text-emerald-700' : 'text-red-700'}`}>
              {isConnected ? 'Connected to PLC' : 'Disconnected'}
            </span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <button
          onClick={() => devices.forEach(d => sendCommand(d.id, 'START'))}
          disabled={!isConnected}
          className="flex items-center justify-center space-x-2 p-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <PlayCircle className="w-5 h-5" />
          <span className="font-semibold">Start All</span>
        </button>

        <button
          onClick={() => devices.forEach(d => sendCommand(d.id, 'STOP'))}
          disabled={!isConnected}
          className="flex items-center justify-center space-x-2 p-4 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <StopCircle className="w-5 h-5" />
          <span className="font-semibold">Stop All</span>
        </button>

        <button
          disabled={!isConnected}
          className="flex items-center justify-center space-x-2 p-4 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Pause className="w-5 h-5" />
          <span className="font-semibold">Pause All</span>
        </button>

        <button
          disabled={!isConnected}
          className="flex items-center justify-center space-x-2 p-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RotateCw className="w-5 h-5" />
          <span className="font-semibold">Reset</span>
        </button>
      </div>

      {/* Device Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {devices.map((device) => (
          <DeviceCard
            key={device.id}
            device={device}
            onCommand={sendCommand}
            onSpeedChange={handleSpeedChange}
            onApplySpeed={applySpeedChange}
            isConnected={isConnected}
          />
        ))}
      </div>

      {/* System Log */}
      <div className="mt-8 bg-white rounded-2xl p-6 shadow-lg">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Control Log</h3>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          <LogEntry
            time="14:32:15"
            message="Motor B started successfully"
            type="success"
          />
          <LogEntry
            time="14:30:42"
            message="Valve 1 opened"
            type="info"
          />
          <LogEntry
            time="14:28:10"
            message="Pump A flow rate adjusted to 85%"
            type="info"
          />
          <LogEntry
            time="14:25:03"
            message="Emergency stop triggered on Motor A"
            type="warning"
          />
          <LogEntry
            time="14:20:15"
            message="System initialized successfully"
            type="success"
          />
        </div>
      </div>
    </div>
  );
};

const DeviceCard = ({ device, onCommand, onSpeedChange, onApplySpeed, isConnected }) => {
  const statusConfig = {
    running: {
      color: 'from-emerald-500 to-teal-600',
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      icon: CheckCircle2
    },
    off: {
      color: 'from-gray-500 to-slate-600',
      bg: 'bg-gray-50',
      text: 'text-gray-700',
      icon: Power
    },
    open: {
      color: 'from-blue-500 to-cyan-600',
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      icon: CheckCircle2
    },
    closed: {
      color: 'from-gray-500 to-slate-600',
      bg: 'bg-gray-50',
      text: 'text-gray-700',
      icon: AlertCircle
    },
  };

  const config = statusConfig[device.status];
  const StatusIcon = config.icon;

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900">{device.name}</h3>
          <p className="text-sm text-gray-500 capitalize">{device.type}</p>
        </div>
        <div className={`p-3 rounded-xl ${config.bg}`}>
          <StatusIcon className={`w-6 h-6 ${config.text}`} />
        </div>
      </div>

      {/* Status Badge */}
      <div className="mb-4">
        <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${config.bg} ${config.text} capitalize`}>
          {device.status}
        </span>
      </div>

      {/* Speed/Position Control for Motors */}
      {device.type === 'motor' && device.status === 'running' && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700">Speed</label>
            <span className="text-sm font-bold text-gray-900">{device.speed}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={device.speed}
            onChange={(e) => onSpeedChange(device.id, e.target.value)}
            onMouseUp={() => onApplySpeed(device.id)}
            onTouchEnd={() => onApplySpeed(device.id)}
            disabled={!isConnected}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer disabled:opacity-50"
          />
        </div>
      )}

      {/* Valve Position */}
      {device.type === 'valve' && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700">Position</label>
            <span className="text-sm font-bold text-gray-900">{device.position}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full bg-gradient-to-r ${config.color} transition-all duration-500`}
              style={{ width: `${device.position}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Pump Flow Rate */}
      {device.type === 'pump' && device.status === 'running' && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700">Flow Rate</label>
            <span className="text-sm font-bold text-gray-900">{device.flow}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-cyan-600 transition-all duration-500"
              style={{ width: `${device.flow}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Control Buttons */}
      <div className="flex space-x-2">
        {(device.status === 'off' || device.status === 'closed') && (
          <button
            onClick={() => onCommand(device.id, device.type === 'valve' ? 'OPEN' : 'START')}
            disabled={!isConnected}
            className={`flex-1 py-2 px-4 rounded-lg font-semibold text-white bg-gradient-to-r ${config.color} hover:shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {device.type === 'valve' ? 'Open' : 'Start'}
          </button>
        )}
        {(device.status === 'running' || device.status === 'open') && (
          <button
            onClick={() => onCommand(device.id, device.type === 'valve' ? 'CLOSE' : 'STOP')}
            disabled={!isConnected}
            className="flex-1 py-2 px-4 rounded-lg font-semibold text-white bg-gradient-to-r from-red-500 to-rose-600 hover:shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {device.type === 'valve' ? 'Close' : 'Stop'}
          </button>
        )}
      </div>
    </div>
  );
};

const LogEntry = ({ time, message, type }) => {
  const typeConfig = {
    success: {
      icon: CheckCircle2,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50'
    },
    info: {
      icon: AlertCircle,
      color: 'text-blue-600',
      bg: 'bg-blue-50'
    },
    warning: {
      icon: AlertCircle,
      color: 'text-amber-600',
      bg: 'bg-amber-50'
    },
  };

  const config = typeConfig[type];
  const Icon = config.icon;

  return (
    <div className={`flex items-center space-x-3 p-3 ${config.bg} rounded-lg`}>
      <Icon className={`w-4 h-4 ${config.color} flex-shrink-0`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900">{message}</p>
      </div>
      <span className="text-xs text-gray-500 font-mono">{time}</span>
    </div>
  );
};

export default Control;
