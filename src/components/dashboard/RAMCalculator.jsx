import { useState } from 'react';
import { Calculator, TrendingUp, AlertTriangle, CheckCircle2, Info, Activity, Clock, Wrench, Target, Lightbulb, Bell, Calendar, Settings } from 'lucide-react';

const RAMCalculator = () => {
  // Color mapping for Tailwind classes (must be explicit for purge)
  const colorClasses = {
    emerald: {
      bgFrom: 'from-emerald-50',
      border: 'border-emerald-100',
      bgDiv: 'bg-emerald-100',
      textIcon: 'text-emerald-600',
      textValue: 'text-emerald-600',
      bgBadge: 'bg-emerald-200',
      textBadge: 'text-emerald-800',
      gradientFrom: 'from-emerald-500',
      gradientTo: 'to-emerald-600',
      bgAlert: 'bg-emerald-50',
      borderAlert: 'border-emerald-500',
      textLight: 'text-emerald-600'
    },
    blue: {
      bgFrom: 'from-blue-50',
      border: 'border-blue-100',
      bgDiv: 'bg-blue-100',
      textIcon: 'text-blue-600',
      textValue: 'text-blue-600',
      bgBadge: 'bg-blue-200',
      textBadge: 'text-blue-800',
      gradientFrom: 'from-blue-500',
      gradientTo: 'to-blue-600',
      bgAlert: 'bg-blue-50',
      borderAlert: 'border-blue-500',
      textLight: 'text-blue-600'
    },
    amber: {
      bgFrom: 'from-amber-50',
      border: 'border-amber-100',
      bgDiv: 'bg-amber-100',
      textIcon: 'text-amber-600',
      textValue: 'text-amber-600',
      bgBadge: 'bg-amber-200',
      textBadge: 'text-amber-800',
      gradientFrom: 'from-amber-500',
      gradientTo: 'to-amber-600',
      bgAlert: 'bg-amber-50',
      borderAlert: 'border-amber-500',
      textLight: 'text-amber-600'
    },
    red: {
      bgFrom: 'from-red-50',
      border: 'border-red-100',
      bgDiv: 'bg-red-100',
      textIcon: 'text-red-600',
      textValue: 'text-red-600',
      bgBadge: 'bg-red-200',
      textBadge: 'text-red-800',
      gradientFrom: 'from-red-500',
      gradientTo: 'to-red-600',
      bgAlert: 'bg-red-50',
      borderAlert: 'border-red-500',
      textLight: 'text-red-600'
    },
    cyan: {
      bgFrom: 'from-cyan-50',
      border: 'border-cyan-100',
      bgDiv: 'bg-cyan-100',
      textIcon: 'text-cyan-600',
      textValue: 'text-cyan-600',
      bgBadge: 'bg-cyan-200',
      textBadge: 'text-cyan-800',
      gradientFrom: 'from-cyan-500',
      gradientTo: 'to-cyan-600',
      bgAlert: 'bg-cyan-50',
      borderAlert: 'border-cyan-500',
      textLight: 'text-cyan-600'
    }
  };

  // Reliability Calculator State
  const [reliabilityInputs, setReliabilityInputs] = useState({
    mtbf: 1000, // Mean Time Between Failures (hours)
    operatingTime: 100,
  });

  // Availability Calculator State
  const [availabilityInputs, setAvailabilityInputs] = useState({
    uptime: 950, // hours
    downtime: 50, // hours
  });

  // Maintainability Calculator State
  const [maintainabilityInputs, setMaintainabilityInputs] = useState({
    maintenanceActions: 10,
    totalDowntime: 20,
  });

  // Calculate Reliability
  const calculateReliability = () => {
    const lambda = 1 / reliabilityInputs.mtbf; // Failure rate
    const t = reliabilityInputs.operatingTime;
    const reliability = Math.exp(-lambda * t) * 100;
    return reliability.toFixed(2);
  };

  // Calculate Availability
  const calculateAvailability = () => {
    const { uptime, downtime } = availabilityInputs;
    const availability = (uptime / (uptime + downtime)) * 100;
    return availability.toFixed(2);
  };

  // Calculate Maintainability (MTTR)
  const calculateMaintainability = () => {
    const mttr = maintainabilityInputs.totalDowntime / maintainabilityInputs.maintenanceActions;
    return mttr.toFixed(2);
  };

  // Get detailed status and recommendations
  const getReliabilityStatus = (value) => {
    const val = parseFloat(value);
    if (val >= 95) {
      return {
        status: 'Excellent',
        color: 'emerald',
        icon: CheckCircle2,
        description: 'System reliability is excellent. Equipment is highly dependable.',
        recommendations: [
          'Continue current maintenance schedule',
          'Document best practices for future reference',
          'Monitor for any degradation trends'
        ],
        emoji: '🎯'
      };
    } else if (val >= 85) {
      return {
        status: 'Good',
        color: 'blue',
        icon: TrendingUp,
        description: 'System reliability is good but has room for improvement.',
        recommendations: [
          'Review and optimize preventive maintenance',
          'Identify components with higher failure rates',
          'Consider upgrading aging equipment'
        ],
        emoji: '✅'
      };
    } else if (val >= 70) {
      return {
        status: 'Fair',
        color: 'amber',
        icon: AlertTriangle,
        description: 'System reliability needs attention. Failures are becoming more frequent.',
        recommendations: [
          'Increase inspection frequency',
          'Review equipment operating conditions',
          'Plan for component replacements',
          'Analyze failure patterns and root causes'
        ],
        emoji: '⚠️'
      };
    } else {
      return {
        status: 'Critical',
        color: 'red',
        icon: AlertTriangle,
        description: 'System reliability is critical. Immediate action required.',
        recommendations: [
          'Conduct thorough equipment inspection immediately',
          'Implement emergency maintenance protocols',
          'Consider equipment replacement',
          'Review and revise maintenance strategy',
          'Increase spare parts inventory'
        ],
        emoji: '🚨'
      };
    }
  };

  const getAvailabilityStatus = (value) => {
    const val = parseFloat(value);
    if (val >= 98) {
      return {
        status: 'World Class',
        color: 'emerald',
        icon: CheckCircle2,
        description: 'Equipment availability meets world-class standards.',
        recommendations: [
          'Maintain current operational excellence',
          'Share best practices across organization',
          'Optimize for cost efficiency'
        ],
        emoji: '🏆'
      };
    } else if (val >= 95) {
      return {
        status: 'Excellent',
        color: 'blue',
        icon: CheckCircle2,
        description: 'Equipment availability is excellent. Minor improvements possible.',
        recommendations: [
          'Reduce planned downtime where possible',
          'Optimize changeover times',
          'Improve predictive maintenance'
        ],
        emoji: '⭐'
      };
    } else if (val >= 90) {
      return {
        status: 'Good',
        color: 'cyan',
        icon: TrendingUp,
        description: 'Equipment availability is acceptable but can be optimized.',
        recommendations: [
          'Reduce unplanned downtime',
          'Improve maintenance scheduling',
          'Implement better spare parts management',
          'Train operators on minor repairs'
        ],
        emoji: '✔️'
      };
    } else if (val >= 80) {
      return {
        status: 'Needs Improvement',
        color: 'amber',
        icon: AlertTriangle,
        description: 'Equipment availability is below target. Production is affected.',
        recommendations: [
          'Analyze downtime causes systematically',
          'Implement quick changeover techniques',
          'Improve preventive maintenance effectiveness',
          'Review equipment operating procedures',
          'Increase maintenance resources'
        ],
        emoji: '⚡'
      };
    } else {
      return {
        status: 'Critical',
        color: 'red',
        icon: AlertTriangle,
        description: 'Equipment availability is critically low. Severe production impact.',
        recommendations: [
          'Declare equipment availability as critical KPI',
          'Form task force to address root causes',
          'Consider equipment replacement or overhaul',
          'Implement 24/7 monitoring',
          'Review entire maintenance strategy',
          'Increase preventive maintenance frequency'
        ],
        emoji: '🔴'
      };
    }
  };

  const getMaintainabilityStatus = (mttr) => {
    const val = parseFloat(mttr);
    if (val <= 1) {
      return {
        status: 'Excellent',
        color: 'emerald',
        icon: CheckCircle2,
        description: 'Repairs are completed very quickly. Excellent maintainability.',
        recommendations: [
          'Document quick repair procedures',
          'Continue skills training programs',
          'Maintain current spare parts strategy'
        ],
        emoji: '⚡'
      };
    } else if (val <= 2) {
      return {
        status: 'Good',
        color: 'blue',
        icon: TrendingUp,
        description: 'Repair times are reasonable. Good maintenance efficiency.',
        recommendations: [
          'Optimize repair procedures',
          'Improve diagnostic tools',
          'Ensure spare parts availability'
        ],
        emoji: '👍'
      };
    } else if (val <= 4) {
      return {
        status: 'Fair',
        color: 'amber',
        icon: AlertTriangle,
        description: 'Repair times are longer than ideal. Improvements needed.',
        recommendations: [
          'Improve technician training',
          'Better diagnostic equipment needed',
          'Review spare parts inventory',
          'Simplify equipment design if possible',
          'Create detailed repair manuals'
        ],
        emoji: '⚠️'
      };
    } else {
      return {
        status: 'Poor',
        color: 'red',
        icon: AlertTriangle,
        description: 'Repair times are excessive. Major improvements required.',
        recommendations: [
          'Conduct training needs analysis',
          'Invest in better diagnostic tools',
          'Redesign for better accessibility',
          'Increase spare parts stock',
          'Consider equipment replacement',
          'Hire additional skilled technicians'
        ],
        emoji: '🔧'
      };
    }
  };

  const reliability = calculateReliability();
  const availability = calculateAvailability();
  const mttr = calculateMaintainability();

  const reliabilityStatus = getReliabilityStatus(reliability);
  const availabilityStatus = getAvailabilityStatus(availability);
  const maintainabilityStatus = getMaintainabilityStatus(mttr);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      <div className="p-8">
      {/* Predictive Maintenance Section */}
      <div className="mb-8">
        <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl shadow-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                <Settings className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Predictive Maintenance</h2>
                <p className="text-indigo-100 text-sm">AI-driven maintenance scheduling based on RAM metrics</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Next Maintenance */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="flex items-center space-x-3 mb-3">
                <Calendar className="w-5 h-5 text-white" />
                <h3 className="text-sm font-semibold text-white">Next Scheduled</h3>
              </div>
              <p className="text-2xl font-bold text-white mb-1">
                {maintainabilityStatus.status === 'Excellent' ? '7 days' :
                 maintainabilityStatus.status === 'Good' ? '5 days' :
                 maintainabilityStatus.status === 'Fair' ? '3 days' : '1 day'}
              </p>
              <p className="text-xs text-indigo-100">Based on MTTR trends</p>
            </div>

            {/* Maintenance Alert */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="flex items-center space-x-3 mb-3">
                <Bell className="w-5 h-5 text-white" />
                <h3 className="text-sm font-semibold text-white">Alert Level</h3>
              </div>
              <p className="text-2xl font-bold text-white mb-1">
                {parseFloat(availability) >= 95 && parseFloat(reliability) >= 90 ? 'Low' :
                 parseFloat(availability) >= 85 || parseFloat(reliability) >= 80 ? 'Medium' : 'High'}
              </p>
              <p className="text-xs text-indigo-100">Maintenance urgency</p>
            </div>

            {/* Predicted Downtime */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
              <div className="flex items-center space-x-3 mb-3">
                <Activity className="w-5 h-5 text-white" />
                <h3 className="text-sm font-semibold text-white">Predicted Impact</h3>
              </div>
              <p className="text-2xl font-bold text-white mb-1">{mttr} hrs</p>
              <p className="text-xs text-indigo-100">Expected downtime</p>
            </div>
          </div>
        </div>
      </div>

      {/* System Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Reliability Overview */}
        <div className={`bg-gradient-to-br ${colorClasses[reliabilityStatus.color].bgFrom} to-white rounded-2xl p-6 shadow-lg border-2 ${colorClasses[reliabilityStatus.color].border}`}>
          <div className="flex items-center mb-4">
            <div className={`p-3 rounded-xl ${colorClasses[reliabilityStatus.color].bgDiv}`}>
              <Target className={`w-6 h-6 ${colorClasses[reliabilityStatus.color].textIcon}`} />
            </div>
          </div>
          <h3 className="text-sm font-semibold text-gray-600 mb-2">Reliability (R)</h3>
          <div className={`text-4xl font-bold ${colorClasses[reliabilityStatus.color].textValue} mb-2`}>
            {reliability}%
          </div>
          <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${colorClasses[reliabilityStatus.color].bgBadge} ${colorClasses[reliabilityStatus.color].textBadge} mb-3`}>
            {reliabilityStatus.status}
          </div>
          <p className="text-sm text-gray-600">{reliabilityStatus.description}</p>
        </div>

        {/* Availability Overview */}
        <div className={`bg-gradient-to-br ${colorClasses[availabilityStatus.color].bgFrom} to-white rounded-2xl p-6 shadow-lg border-2 ${colorClasses[availabilityStatus.color].border}`}>
          <div className="flex items-center mb-4">
            <div className={`p-3 rounded-xl ${colorClasses[availabilityStatus.color].bgDiv}`}>
              <Clock className={`w-6 h-6 ${colorClasses[availabilityStatus.color].textIcon}`} />
            </div>
          </div>
          <h3 className="text-sm font-semibold text-gray-600 mb-2">Availability (A)</h3>
          <div className={`text-4xl font-bold ${colorClasses[availabilityStatus.color].textValue} mb-2`}>
            {availability}%
          </div>
          <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${colorClasses[availabilityStatus.color].bgBadge} ${colorClasses[availabilityStatus.color].textBadge} mb-3`}>
            {availabilityStatus.status}
          </div>
          <p className="text-sm text-gray-600">{availabilityStatus.description}</p>
        </div>

        {/* Maintainability Overview */}
        <div className={`bg-gradient-to-br ${colorClasses[maintainabilityStatus.color].bgFrom} to-white rounded-2xl p-6 shadow-lg border-2 ${colorClasses[maintainabilityStatus.color].border}`}>
          <div className="flex items-center mb-4">
            <div className={`p-3 rounded-xl ${colorClasses[maintainabilityStatus.color].bgDiv}`}>
              <Wrench className={`w-6 h-6 ${colorClasses[maintainabilityStatus.color].textIcon}`} />
            </div>
          </div>
          <h3 className="text-sm font-semibold text-gray-600 mb-2">Maintainability (MTTR)</h3>
          <div className={`text-4xl font-bold ${colorClasses[maintainabilityStatus.color].textValue} mb-2`}>
            {mttr} hrs
          </div>
          <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${colorClasses[maintainabilityStatus.color].bgBadge} ${colorClasses[maintainabilityStatus.color].textBadge} mb-3`}>
            {maintainabilityStatus.status}
          </div>
          <p className="text-sm text-gray-600">{maintainabilityStatus.description}</p>
        </div>
      </div>

      {/* Calculators Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Reliability Calculator */}
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600">
              <Calculator className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Reliability Calculator</h3>
              <p className="text-xs text-gray-500">R(t) = e^(-λt)</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                MTBF (Mean Time Between Failures)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={reliabilityInputs.mtbf}
                  onChange={(e) => setReliabilityInputs({ ...reliabilityInputs, mtbf: parseFloat(e.target.value) })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none font-semibold"
                  placeholder="1000"
                />
                <span className="absolute right-4 top-3 text-gray-500 font-medium">hours</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Average time between equipment failures</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Operating Time
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={reliabilityInputs.operatingTime}
                  onChange={(e) => setReliabilityInputs({ ...reliabilityInputs, operatingTime: parseFloat(e.target.value) })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none font-semibold"
                  placeholder="100"
                />
                <span className="absolute right-4 top-3 text-gray-500 font-medium">hours</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Period of operation to calculate</p>
            </div>

            <div className="pt-4 border-t-2 border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-gray-600">Reliability</span>
                <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  {reliability}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-3 rounded-full bg-gradient-to-r ${colorClasses[reliabilityStatus.color].gradientFrom} ${colorClasses[reliabilityStatus.color].gradientTo} transition-all duration-500`}
                  style={{ width: `${reliability}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Availability Calculator */}
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Availability Calculator</h3>
              <p className="text-xs text-gray-500">A = Uptime / (Uptime + Downtime)</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Uptime
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={availabilityInputs.uptime}
                  onChange={(e) => setAvailabilityInputs({ ...availabilityInputs, uptime: parseFloat(e.target.value) })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-cyan-500 focus:outline-none font-semibold"
                  placeholder="950"
                />
                <span className="absolute right-4 top-3 text-gray-500 font-medium">hours</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Total operational time</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Downtime
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={availabilityInputs.downtime}
                  onChange={(e) => setAvailabilityInputs({ ...availabilityInputs, downtime: parseFloat(e.target.value) })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-cyan-500 focus:outline-none font-semibold"
                  placeholder="50"
                />
                <span className="absolute right-4 top-3 text-gray-500 font-medium">hours</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Total downtime (planned + unplanned)</p>
            </div>

            <div className="pt-4 border-t-2 border-gray-100">
              <div className="bg-gradient-to-r from-cyan-50 to-blue-50 rounded-xl p-3 mb-3">
                <div className="flex justify-between text-xs font-semibold text-gray-600 mb-1">
                  <span>Total Time:</span>
                  <span>{availabilityInputs.uptime + availabilityInputs.downtime} hours</span>
                </div>
                <div className="flex justify-between text-xs font-semibold text-gray-600">
                  <span>Downtime %:</span>
                  <span>{((availabilityInputs.downtime / (availabilityInputs.uptime + availabilityInputs.downtime)) * 100).toFixed(2)}%</span>
                </div>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-gray-600">Availability</span>
                <span className="text-2xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                  {availability}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-3 rounded-full bg-gradient-to-r ${colorClasses[availabilityStatus.color].gradientFrom} ${colorClasses[availabilityStatus.color].gradientTo} transition-all duration-500`}
                  style={{ width: `${availability}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Maintainability Calculator */}
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600">
              <Wrench className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Maintainability Calculator</h3>
              <p className="text-xs text-gray-500">MTTR = Total Downtime / Actions</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Maintenance Actions
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={maintainabilityInputs.maintenanceActions}
                  onChange={(e) => setMaintainabilityInputs({ ...maintainabilityInputs, maintenanceActions: parseFloat(e.target.value) })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none font-semibold"
                  placeholder="10"
                />
                <span className="absolute right-4 top-3 text-gray-500 font-medium">times</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Number of repair/maintenance events</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Total Downtime
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={maintainabilityInputs.totalDowntime}
                  onChange={(e) => setMaintainabilityInputs({ ...maintainabilityInputs, totalDowntime: parseFloat(e.target.value) })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none font-semibold"
                  placeholder="20"
                />
                <span className="absolute right-4 top-3 text-gray-500 font-medium">hours</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Total time spent on repairs</p>
            </div>

            <div className="pt-4 border-t-2 border-gray-100">
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-3 mb-3">
                <div className="flex justify-between text-xs font-semibold text-gray-600">
                  <span>Avg. Repair Time:</span>
                  <span>{mttr} hours per event</span>
                </div>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-gray-600">MTTR</span>
                <span className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  {mttr} hrs
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-3 rounded-full bg-gradient-to-r ${colorClasses[maintainabilityStatus.color].gradientFrom} ${colorClasses[maintainabilityStatus.color].gradientTo} transition-all duration-500`}
                  style={{ width: `${Math.min(100, (6 - parseFloat(mttr)) / 6 * 100)}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 mt-1 text-center">Lower is better</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recommendations Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Reliability Recommendations */}
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <div className="flex items-center space-x-3 mb-4">
            <Lightbulb className={`w-6 h-6 ${colorClasses[reliabilityStatus.color].textLight}`} />
            <h3 className="text-lg font-bold text-gray-900">Reliability Insights</h3>
          </div>
          <div className={`${colorClasses[reliabilityStatus.color].bgAlert} border-l-4 ${colorClasses[reliabilityStatus.color].borderAlert} rounded-lg p-4 mb-4`}>
            <p className="text-sm font-semibold text-gray-700">
              {reliabilityStatus.description}
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-bold text-gray-700 mb-2">Recommendations:</p>
            {reliabilityStatus.recommendations.map((rec, idx) => (
              <div key={idx} className="flex items-start space-x-2">
                <CheckCircle2 className={`w-4 h-4 ${colorClasses[reliabilityStatus.color].textLight} flex-shrink-0 mt-0.5`} />
                <p className="text-sm text-gray-600">{rec}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Availability Recommendations */}
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <div className="flex items-center space-x-3 mb-4">
            <Lightbulb className={`w-6 h-6 ${colorClasses[availabilityStatus.color].textLight}`} />
            <h3 className="text-lg font-bold text-gray-900">Availability Insights</h3>
          </div>
          <div className={`${colorClasses[availabilityStatus.color].bgAlert} border-l-4 ${colorClasses[availabilityStatus.color].borderAlert} rounded-lg p-4 mb-4`}>
            <p className="text-sm font-semibold text-gray-700">
              {availabilityStatus.description}
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-bold text-gray-700 mb-2">Recommendations:</p>
            {availabilityStatus.recommendations.map((rec, idx) => (
              <div key={idx} className="flex items-start space-x-2">
                <CheckCircle2 className={`w-4 h-4 ${colorClasses[availabilityStatus.color].textLight} flex-shrink-0 mt-0.5`} />
                <p className="text-sm text-gray-600">{rec}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Maintainability Recommendations */}
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <div className="flex items-center space-x-3 mb-4">
            <Lightbulb className={`w-6 h-6 ${colorClasses[maintainabilityStatus.color].textLight}`} />
            <h3 className="text-lg font-bold text-gray-900">Maintainability Insights</h3>
          </div>
          <div className={`${colorClasses[maintainabilityStatus.color].bgAlert} border-l-4 ${colorClasses[maintainabilityStatus.color].borderAlert} rounded-lg p-4 mb-4`}>
            <p className="text-sm font-semibold text-gray-700">
              {maintainabilityStatus.description}
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-bold text-gray-700 mb-2">Recommendations:</p>
            {maintainabilityStatus.recommendations.map((rec, idx) => (
              <div key={idx} className="flex items-start space-x-2">
                <CheckCircle2 className={`w-4 h-4 ${colorClasses[maintainabilityStatus.color].textLight} flex-shrink-0 mt-0.5`} />
                <p className="text-sm text-gray-600">{rec}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Reference Guide */}
      <div className="mt-8 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-8 shadow-xl text-white">
        <div className="flex items-center space-x-3 mb-6">
          <Info className="w-7 h-7 text-indigo-400" />
          <h3 className="text-2xl font-bold">RAM Metrics Reference Guide</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/10 rounded-xl p-5 backdrop-blur-sm border border-white/20">
            <h4 className="font-bold text-lg mb-3 text-indigo-300">Reliability (R)</h4>
            <p className="text-sm text-gray-300 mb-3">
              The probability that equipment will perform its intended function without failure for a specified period.
            </p>
            <div className="bg-slate-950/50 rounded-lg p-3 font-mono text-xs mb-3">
              R(t) = e^(-λt)
            </div>
            <ul className="text-xs text-gray-300 space-y-1">
              <li>• λ = Failure rate (1/MTBF)</li>
              <li>• t = Operating time</li>
              <li>• Higher % = More reliable</li>
            </ul>
          </div>

          <div className="bg-white/10 rounded-xl p-5 backdrop-blur-sm border border-white/20">
            <h4 className="font-bold text-lg mb-3 text-cyan-300">Availability (A)</h4>
            <p className="text-sm text-gray-300 mb-3">
              The percentage of time equipment is operational and ready for use.
            </p>
            <div className="bg-slate-950/50 rounded-lg p-3 font-mono text-xs mb-3">
              A = Uptime / (Uptime + Downtime)
            </div>
            <ul className="text-xs text-gray-300 space-y-1">
              <li>• Target: &gt;95% (World-class: &gt;98%)</li>
              <li>• Includes planned & unplanned stops</li>
              <li>• Key OEE component</li>
            </ul>
          </div>

          <div className="bg-white/10 rounded-xl p-5 backdrop-blur-sm border border-white/20">
            <h4 className="font-bold text-lg mb-3 text-emerald-300">Maintainability (MTTR)</h4>
            <p className="text-sm text-gray-300 mb-3">
              Average time required to repair equipment and restore it to operational status.
            </p>
            <div className="bg-slate-950/50 rounded-lg p-3 font-mono text-xs mb-3">
              MTTR = Total Downtime / Actions
            </div>
            <ul className="text-xs text-gray-300 space-y-1">
              <li>• Lower hours = Better</li>
              <li>• Target: &lt;2 hours</li>
              <li>• Indicates repair efficiency</li>
            </ul>
          </div>
        </div>

        <div className="mt-6 bg-indigo-500/20 border border-indigo-400/30 rounded-xl p-4">
          <p className="text-sm text-indigo-200">
            <strong>Note:</strong> These metrics are interconnected. High reliability reduces failures, high availability maximizes production time,
            and good maintainability ensures quick recovery from failures. Optimize all three for best results.
          </p>
        </div>
      </div>
      </div>
    </div>
  );
};

export default RAMCalculator;
