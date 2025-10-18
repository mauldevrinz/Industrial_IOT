import React, { useState, useEffect } from 'react';
import { Wrench, AlertTriangle, CheckCircle, Clock, Calendar } from 'lucide-react';
import { useMQTT } from '../../hooks/useMQTT';
import { mqttConfig } from '../../config/mqtt.config';

const Maintenance = () => {
  const { subscribe, isConnected } = useMQTT();
  const [alerts, setAlerts] = useState([]);

  const [schedules] = useState([
    {
      id: 1,
      equipment: 'Machine A - Motor',
      type: 'Preventive',
      dueDate: '2025-10-20',
      status: 'scheduled',
      lastMaintenance: '2025-09-20',
      frequency: 'Monthly',
    },
    {
      id: 2,
      equipment: 'Machine B - Hydraulic System',
      type: 'Preventive',
      dueDate: '2025-10-18',
      status: 'overdue',
      lastMaintenance: '2025-08-18',
      frequency: 'Monthly',
    },
    {
      id: 3,
      equipment: 'Machine C - Conveyor Belt',
      type: 'Inspection',
      dueDate: '2025-10-25',
      status: 'scheduled',
      lastMaintenance: '2025-10-10',
      frequency: 'Weekly',
    },
    {
      id: 4,
      equipment: 'Machine D - Control Panel',
      type: 'Corrective',
      dueDate: '2025-10-17',
      status: 'in-progress',
      lastMaintenance: '2025-07-15',
      frequency: 'As Needed',
    },
  ]);

  const [maintenanceHistory] = useState([
    {
      id: 1,
      date: '2025-10-15',
      equipment: 'Machine A',
      type: 'Preventive',
      technician: 'John Doe',
      duration: '2 hours',
      cost: '$150',
      status: 'completed',
    },
    {
      id: 2,
      date: '2025-10-12',
      equipment: 'Machine C',
      type: 'Inspection',
      technician: 'Jane Smith',
      duration: '1 hour',
      cost: '$75',
      status: 'completed',
    },
    {
      id: 3,
      date: '2025-10-10',
      equipment: 'Machine B',
      type: 'Corrective',
      technician: 'Mike Johnson',
      duration: '4 hours',
      cost: '$350',
      status: 'completed',
    },
  ]);

  useEffect(() => {
    if (!isConnected) return;

    const unsubscribe = subscribe(mqttConfig.topics.maintenanceAlert, (payload) => {
      setAlerts(prev => [
        {
          id: Date.now(),
          ...payload,
          timestamp: new Date(),
        },
        ...prev.slice(0, 9), // Keep last 10 alerts
      ]);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [subscribe, isConnected]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const overdueCount = schedules.filter(s => s.status === 'overdue').length;
  const scheduledCount = schedules.filter(s => s.status === 'scheduled').length;
  const inProgressCount = schedules.filter(s => s.status === 'in-progress').length;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Maintenance Management</h1>
        <p className="text-gray-600 mt-1">Track and manage equipment maintenance schedules</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <SummaryCard
          title="Overdue"
          value={overdueCount}
          icon={AlertTriangle}
          color="red"
        />
        <SummaryCard
          title="Scheduled"
          value={scheduledCount}
          icon={Calendar}
          color="blue"
        />
        <SummaryCard
          title="In Progress"
          value={inProgressCount}
          icon={Clock}
          color="yellow"
        />
        <SummaryCard
          title="Completed (This Month)"
          value={maintenanceHistory.length}
          icon={CheckCircle}
          color="green"
        />
      </div>

      {/* Real-time Alerts */}
      {alerts.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <AlertTriangle className="w-6 h-6 text-yellow-500 mr-2" />
            Real-time Alerts
          </h2>
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="flex items-center justify-between p-4 bg-yellow-50 border-l-4 border-yellow-500 rounded"
              >
                <div>
                  <p className="font-medium text-gray-900">{alert.message}</p>
                  <p className="text-sm text-gray-500">
                    {alert.equipment} - {alert.timestamp.toLocaleTimeString()}
                  </p>
                </div>
                <span className="px-3 py-1 text-xs font-semibold bg-yellow-200 text-yellow-800 rounded-full">
                  {alert.severity || 'Warning'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Maintenance Schedule */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Maintenance Schedule</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Equipment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Due Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Maintenance
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Frequency
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {schedules.map((schedule) => (
                <tr key={schedule.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Wrench className="w-5 h-5 text-gray-400 mr-3" />
                      <div className="text-sm font-medium text-gray-900">
                        {schedule.equipment}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {schedule.type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {schedule.dueDate}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {schedule.lastMaintenance}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {schedule.frequency}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(schedule.status)}`}>
                      {schedule.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Maintenance History */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Maintenance History</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Equipment
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Technician
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cost
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {maintenanceHistory.map((history) => (
                <tr key={history.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {history.date}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {history.equipment}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {history.type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {history.technician}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {history.duration}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {history.cost}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(history.status)}`}>
                      {history.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const SummaryCard = ({ title, value, icon: Icon, color }) => {
  const colorClasses = {
    red: 'bg-red-500',
    blue: 'bg-blue-500',
    yellow: 'bg-yellow-500',
    green: 'bg-green-500',
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
        </div>
        <div className={`${colorClasses[color]} p-4 rounded-full`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
};

export default Maintenance;
