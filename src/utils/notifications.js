// Browser Notifications Utility

// Request notification permission
export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
};

// Show browser notification
export const showNotification = (title, options = {}) => {
  if (Notification.permission === 'granted') {
    const notification = new Notification(title, {
      icon: '/vite.svg',
      badge: '/vite.svg',
      ...options,
    });

    // Auto close after 5 seconds
    setTimeout(() => notification.close(), 5000);

    return notification;
  }
  return null;
};

// Show alert notification
export const showAlertNotification = (message, type = 'info') => {
  const titles = {
    info: '📋 Information',
    success: '✅ Success',
    warning: '⚠️ Warning',
    error: '❌ Error',
    critical: '🚨 Critical Alert',
  };

  const icons = {
    info: '📋',
    success: '✅',
    warning: '⚠️',
    error: '❌',
    critical: '🚨',
  };

  showNotification(titles[type] || titles.info, {
    body: message,
    icon: icons[type],
    tag: `alert-${Date.now()}`,
  });
};

// Show maintenance reminder
export const showMaintenanceReminder = (equipment, dueDate) => {
  showNotification('🔧 Maintenance Reminder', {
    body: `Scheduled maintenance for ${equipment} is due on ${dueDate}`,
    tag: 'maintenance-reminder',
    requireInteraction: true,
  });
};

// Show sensor alert
export const showSensorAlert = (sensorName, value, threshold, type = 'high') => {
  const message = type === 'high'
    ? `${sensorName} is above threshold: ${value} (limit: ${threshold})`
    : `${sensorName} is below threshold: ${value} (limit: ${threshold})`;

  showNotification('🚨 Sensor Alert', {
    body: message,
    tag: 'sensor-alert',
    requireInteraction: true,
  });
};

// Show connection status notification
export const showConnectionNotification = (isConnected) => {
  if (isConnected) {
    showNotification('✅ MQTT Connected', {
      body: 'Successfully connected to MQTT broker',
      tag: 'mqtt-connection',
    });
  } else {
    showNotification('❌ MQTT Disconnected', {
      body: 'Lost connection to MQTT broker',
      tag: 'mqtt-connection',
    });
  }
};

export default {
  requestNotificationPermission,
  showNotification,
  showAlertNotification,
  showMaintenanceReminder,
  showSensorAlert,
  showConnectionNotification,
};
