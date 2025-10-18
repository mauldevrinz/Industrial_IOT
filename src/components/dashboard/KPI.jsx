import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { TrendingUp, TrendingDown, Target, Award, Zap, Clock, CheckCircle2 } from 'lucide-react';
import { useMQTT } from '../../hooks/useMQTT';
import { mqttConfig } from '../../config/mqtt.config';

const CircularKPI = ({ title, value, icon: Icon, gradient, target = 85 }) => {
  const radius = 70;
  const strokeWidth = 12;
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  const getStatus = () => {
    if (value >= target) return { color: 'text-emerald-500', label: 'Excellent', emoji: '🎯' };
    if (value >= target - 15) return { color: 'text-amber-500', label: 'Good', emoji: '⚠️' };
    return { color: 'text-red-500', label: 'Needs Attention', emoji: '⚡' };
  };

  const status = getStatus();

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl bg-gradient-to-br ${gradient} bg-opacity-10`}>
          <Icon className={`w-6 h-6 bg-gradient-to-br ${gradient} bg-clip-text text-transparent`} />
        </div>
        <span className="text-2xl">{status.emoji}</span>
      </div>

      <div className="relative flex justify-center mb-4">
        <svg height={radius * 2} width={radius * 2} className="transform -rotate-90">
          <defs>
            <linearGradient id={`gradient-${title}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
          </defs>
          <circle
            stroke="#e5e7eb"
            fill="transparent"
            strokeWidth={strokeWidth}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          <circle
            stroke={`url(#gradient-${title})`}
            fill="transparent"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference + ' ' + circumference}
            style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.5s ease' }}
            strokeLinecap="round"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-3xl font-bold bg-gradient-to-br ${gradient} bg-clip-text text-transparent`}>
            {value.toFixed(1)}
          </span>
          <span className="text-sm text-gray-500 font-semibold">%</span>
        </div>
      </div>

      <div className="text-center">
        <h3 className="text-base font-bold text-gray-900 mb-1">{title}</h3>
        <p className={`text-xs font-semibold ${status.color}`}>{status.label}</p>
        <p className="text-xs text-gray-500 mt-2">Target: {target}%</p>
      </div>
    </div>
  );
};

const MetricCard = ({ label, value, unit, trend, icon: Icon, color }) => {
  return (
    <div className={`bg-gradient-to-br ${color} rounded-xl p-5 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1`}>
      <div className="flex items-start justify-between mb-3">
        <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
          <Icon className="w-5 h-5" />
        </div>
        {trend !== undefined && (
          <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-bold ${
            trend >= 0 ? 'bg-white/30' : 'bg-black/30'
          }`}>
            {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            <span>{Math.abs(trend)}%</span>
          </div>
        )}
      </div>
      <div>
        <p className="text-sm font-medium text-white/80 mb-1">{label}</p>
        <div className="flex items-baseline space-x-2">
          <span className="text-3xl font-bold">{value}</span>
          <span className="text-sm font-semibold opacity-80">{unit}</span>
        </div>
      </div>
    </div>
  );
};

const KPI = () => {
  const { subscribe, isConnected } = useMQTT();
  const [kpiData, setKpiData] = useState({
    oee: 87.5,
    availability: 92.3,
    performance: 94.8,
    quality: 96.2,
  });

  const [productionData] = useState([
    { shift: 'Shift 1', target: 1000, actual: 950 },
    { shift: 'Shift 2', target: 1000, actual: 1020 },
    { shift: 'Shift 3', target: 1000, actual: 880 },
  ]);

  const radarData = [
    { metric: 'Availability', value: kpiData.availability, fullMark: 100 },
    { metric: 'Performance', value: kpiData.performance, fullMark: 100 },
    { metric: 'Quality', value: kpiData.quality, fullMark: 100 },
    { metric: 'OEE', value: kpiData.oee, fullMark: 100 },
  ];

  useEffect(() => {
    if (!isConnected) return;

    const { topics } = mqttConfig;
    const unsubscribers = [];

    unsubscribers.push(
      subscribe(topics.oee, (payload) => {
        setKpiData(prev => ({ ...prev, oee: payload.value || 0 }));
      })
    );

    unsubscribers.push(
      subscribe(topics.availability, (payload) => {
        setKpiData(prev => ({ ...prev, availability: payload.value || 0 }));
      })
    );

    unsubscribers.push(
      subscribe(topics.performance, (payload) => {
        setKpiData(prev => ({ ...prev, performance: payload.value || 0 }));
      })
    );

    unsubscribers.push(
      subscribe(topics.quality, (payload) => {
        setKpiData(prev => ({ ...prev, quality: payload.value || 0 }));
      })
    );

    return () => {
      unsubscribers.forEach(unsub => unsub && unsub());
    };
  }, [subscribe, isConnected]);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 rounded-xl shadow-xl border-2 border-indigo-100">
          <p className="font-bold text-gray-900 mb-2">{payload[0].payload.shift}</p>
          <div className="space-y-1">
            <p className="text-sm text-gray-600">Target: <span className="font-bold text-gray-900">{payload[0].payload.target}</span></p>
            <p className="text-sm text-gray-600">Actual: <span className="font-bold text-indigo-600">{payload[0].payload.actual}</span></p>
            <p className="text-sm text-gray-600">
              Achievement: <span className={`font-bold ${payload[0].payload.actual >= payload[0].payload.target ? 'text-emerald-600' : 'text-amber-600'}`}>
                {((payload[0].payload.actual / payload[0].payload.target) * 100).toFixed(1)}%
              </span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent mb-2">
              Performance Indicators
            </h1>
            <p className="text-gray-600">Monitoring production efficiency and quality</p>
          </div>
          <div className="bg-white px-6 py-3 rounded-xl shadow-md flex items-center space-x-3">
            <Award className="w-6 h-6 text-amber-500" />
            <div>
              <p className="text-xs text-gray-500">OEE Target</p>
              <p className="text-lg font-bold text-gray-900">85%</p>
            </div>
          </div>
        </div>
      </div>

      {/* OEE Main Dashboard */}
      <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Overall Equipment Effectiveness</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <CircularKPI
            title="OEE"
            value={kpiData.oee}
            icon={Target}
            gradient="from-indigo-500 to-purple-600"
            target={85}
          />
          <CircularKPI
            title="Availability"
            value={kpiData.availability}
            icon={Clock}
            gradient="from-emerald-500 to-teal-600"
            target={85}
          />
          <CircularKPI
            title="Performance"
            value={kpiData.performance}
            icon={Zap}
            gradient="from-blue-500 to-cyan-600"
            target={85}
          />
          <CircularKPI
            title="Quality"
            value={kpiData.quality}
            icon={CheckCircle2}
            gradient="from-pink-500 to-rose-600"
            target={85}
          />
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Production by Shift */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Production by Shift</h2>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={productionData}>
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={0.8} />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.6} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="shift"
                stroke="#6b7280"
                style={{ fontSize: '14px', fontWeight: 600 }}
              />
              <YAxis
                stroke="#6b7280"
                style={{ fontSize: '12px', fontWeight: 500 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="target" fill="#94a3b8" radius={[8, 8, 0, 0]} />
              <Bar dataKey="actual" fill="url(#barGradient)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Radar Chart */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Performance Radar</h2>
          <ResponsiveContainer width="100%" height={350}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#e5e7eb" />
              <PolarAngleAxis
                dataKey="metric"
                style={{ fontSize: '12px', fontWeight: 600, fill: '#4b5563' }}
              />
              <PolarRadiusAxis angle={90} domain={[0, 100]} />
              <Radar
                name="Current"
                dataKey="value"
                stroke="#6366f1"
                fill="#6366f1"
                fillOpacity={0.6}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Performance Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <MetricCard
          label="Production Rate"
          value="950"
          unit="unit/hr"
          trend={-5}
          icon={Zap}
          color="from-indigo-500 to-purple-600"
        />
        <MetricCard
          label="Cycle Time"
          value="3.8"
          unit="sec"
          trend={5.5}
          icon={Clock}
          color="from-cyan-500 to-blue-600"
        />
        <MetricCard
          label="Downtime"
          value="45"
          unit="min"
          trend={-15}
          icon={TrendingDown}
          color="from-amber-500 to-orange-600"
        />
        <MetricCard
          label="First Pass Yield"
          value="96.5"
          unit="%"
          trend={1.5}
          icon={CheckCircle2}
          color="from-emerald-500 to-teal-600"
        />
      </div>

      {/* Production Targets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <TargetCard title="Today's Production" current={2850} target={3000} unit="unit" />
        <TargetCard title="Weekly Production" current={18500} target={21000} unit="unit" />
        <TargetCard title="Monthly Production" current={75200} target={90000} unit="unit" />
      </div>
    </div>
  );
};

const TargetCard = ({ title, current, target, unit }) => {
  const percentage = (current / target) * 100;
  const remaining = target - current;

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
      <h3 className="font-bold text-gray-900 text-lg mb-4">{title}</h3>
      <div className="mb-4">
        <div className="flex items-baseline justify-between mb-2">
          <span className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-blue-600 bg-clip-text text-transparent">
            {current.toLocaleString()}
          </span>
          <span className="text-sm text-gray-500 font-medium">/ {target.toLocaleString()} {unit}</span>
        </div>
        <div className="relative w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className={`h-3 rounded-full transition-all duration-500 ${
              percentage >= 100
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                : percentage >= 80
                ? 'bg-gradient-to-r from-blue-500 to-cyan-500'
                : 'bg-gradient-to-r from-amber-500 to-orange-500'
            }`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          >
            <div className="h-full w-full bg-white/20 animate-pulse"></div>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold text-gray-700">{percentage.toFixed(1)}% Achieved</span>
        <span className={`font-bold ${remaining > 0 ? 'text-orange-600' : 'text-emerald-600'}`}>
          {remaining > 0 ? `${remaining.toLocaleString()} remaining` : 'Target achieved! 🎉'}
        </span>
      </div>
    </div>
  );
};

export default KPI;
