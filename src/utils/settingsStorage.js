// Settings Storage Utility
// Handles persistent storage of application settings

const STORAGE_KEYS = {
  MQTT_SETTINGS: 'iiot_mqtt_settings',
  NOTIFICATION_SETTINGS: 'iiot_notification_settings',
  DATA_SETTINGS: 'iiot_data_settings',
};

// Default settings
const DEFAULT_SETTINGS = {
  mqtt: {
    host: 'localhost',
    port: 8883,
    clientId: 'iiot_dashboard_' + Math.random().toString(16).substring(2, 10),
    username: '',
    password: '',
  },
  notifications: {
    enableAlerts: true,
    emailNotifications: false,
    smsNotifications: false,
    maintenanceReminders: true,
    browserNotifications: true,
  },
  data: {
    dataRetention: 30,
    sampleRate: 1000,
    autoExport: false,
    exportFormat: 'csv',
  },
};

// Save settings to localStorage
export const saveSettings = (key, settings) => {
  try {
    localStorage.setItem(STORAGE_KEYS[key], JSON.stringify(settings));
    return { success: true, message: 'Settings saved successfully' };
  } catch (error) {
    console.error('Error saving settings:', error);
    return { success: false, message: 'Failed to save settings', error };
  }
};

// Load settings from localStorage
export const loadSettings = (key) => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS[key]);
    if (stored) {
      return JSON.parse(stored);
    }
    return DEFAULT_SETTINGS[key.toLowerCase()];
  } catch (error) {
    console.error('Error loading settings:', error);
    return DEFAULT_SETTINGS[key.toLowerCase()];
  }
};

// Clear all settings
export const clearAllSettings = () => {
  try {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    return { success: true, message: 'All settings cleared' };
  } catch (error) {
    console.error('Error clearing settings:', error);
    return { success: false, message: 'Failed to clear settings', error };
  }
};

// Export settings as JSON file
export const exportSettingsToFile = () => {
  try {
    const allSettings = {
      mqtt: loadSettings('MQTT_SETTINGS'),
      notifications: loadSettings('NOTIFICATION_SETTINGS'),
      data: loadSettings('DATA_SETTINGS'),
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(allSettings, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `iiot_settings_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    window.URL.revokeObjectURL(url);

    return { success: true, message: 'Settings exported successfully' };
  } catch (error) {
    console.error('Error exporting settings:', error);
    return { success: false, message: 'Failed to export settings', error };
  }
};

// Import settings from JSON file
export const importSettingsFromFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const settings = JSON.parse(e.target.result);

        if (settings.mqtt) saveSettings('MQTT_SETTINGS', settings.mqtt);
        if (settings.notifications) saveSettings('NOTIFICATION_SETTINGS', settings.notifications);
        if (settings.data) saveSettings('DATA_SETTINGS', settings.data);

        resolve({ success: true, message: 'Settings imported successfully' });
      } catch (error) {
        reject({ success: false, message: 'Invalid settings file', error });
      }
    };

    reader.onerror = () => {
      reject({ success: false, message: 'Failed to read file' });
    };

    reader.readAsText(file);
  });
};

export default {
  saveSettings,
  loadSettings,
  clearAllSettings,
  exportSettingsToFile,
  importSettingsFromFile,
  DEFAULT_SETTINGS,
};
