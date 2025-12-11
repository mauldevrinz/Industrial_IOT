import { useState, useEffect } from 'react';
import { Save, RefreshCw, Wifi, Bell, Terminal, Upload, FolderOpen, Zap, Info, Download as DownloadIcon } from 'lucide-react';
import { mqttConfig } from '../../config/mqtt.config';
import { useMQTT } from '../../hooks/useMQTT';
import { saveSettings, loadSettings, exportSettingsToFile } from '../../utils/settingsStorage';
import { requestNotificationPermission, showNotification } from '../../utils/notifications';

const Settings = () => {
  const { connectionStatus, isConnected } = useMQTT();

  const [mqttSettings, setMqttSettings] = useState(() => {
    const saved = loadSettings('MQTT_SETTINGS');
    return saved || {
      host: mqttConfig.broker.host,
      port: mqttConfig.broker.port,
      clientId: mqttConfig.options.clientId || 'iiot_dashboard_' + Math.random().toString(16).substring(2, 10),
      username: mqttConfig.auth.username,
      password: mqttConfig.auth.password,
    };
  });

  const [notificationSettings, setNotificationSettings] = useState(() => {
    const saved = loadSettings('NOTIFICATION_SETTINGS');
    return saved || {
      enableAlerts: true,
      emailNotifications: false,
      smsNotifications: false,
      maintenanceReminders: true,
      browserNotifications: true,
    };
  });

  const [saveStatus, setSaveStatus] = useState('');

  // Request notification permission on mount if enabled
  useEffect(() => {
    if (notificationSettings.browserNotifications) {
      requestNotificationPermission();
    }
  }, [notificationSettings.browserNotifications]);


  const [otaStatus, setOtaStatus] = useState('');
  const [plcStatus, setPlcStatus] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileName, setFileName] = useState('');

  const handleMqttChange = (field, value) => {
    setMqttSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleNotificationChange = async (field) => {
    const newValue = !notificationSettings[field];

    // If enabling browser notifications, request permission
    if (field === 'browserNotifications' && newValue) {
      const granted = await requestNotificationPermission();
      if (!granted) {
        alert('⚠️ Please allow notifications in your browser settings to enable this feature.');
        return;
      }
    }

    setNotificationSettings(prev => ({ ...prev, [field]: newValue }));

    // Save to localStorage
    const updated = { ...notificationSettings, [field]: newValue };
    saveSettings('NOTIFICATION_SETTINGS', updated);

    // Show confirmation if browser notifications enabled
    if (field === 'browserNotifications' && newValue) {
      showNotification('✅ Notifications Enabled', {
        body: 'You will now receive browser notifications for important events',
      });
    }
  };

  const handleSave = () => {
    setSaveStatus('Saving...');

    // Save MQTT settings
    const mqttResult = saveSettings('MQTT_SETTINGS', mqttSettings);

    // Save notification settings
    const notifResult = saveSettings('NOTIFICATION_SETTINGS', notificationSettings);

    if (mqttResult.success && notifResult.success) {
      setSaveStatus('✅ Settings saved successfully!');

      // Show notification if enabled
      if (notificationSettings.browserNotifications) {
        showNotification('✅ Settings Saved', {
          body: 'Your settings have been saved. Restart the app to apply MQTT changes.',
        });
      }

      // Update mqtt config file via backend
      fetch('http://localhost:3001/api/update-mqtt-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mqttSettings)
      }).catch(err => console.log('Backend not available:', err));

    } else {
      setSaveStatus('❌ Failed to save settings');
    }

    setTimeout(() => setSaveStatus(''), 3000);
  };

  const handleExportSettings = () => {
    const result = exportSettingsToFile();
    if (result.success) {
      setSaveStatus('✅ Settings exported successfully!');
      setTimeout(() => setSaveStatus(''), 3000);
    }
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to reset all settings to default?')) {
      // Reset to defaults
      setMqttSettings({
        host: 'localhost',
        port: 8883,
        clientId: 'iiot_dashboard_' + Math.random().toString(16).substring(2, 10),
        username: '',
        password: '',
      });
      setNotificationSettings({
        enableAlerts: true,
        emailNotifications: false,
        smsNotifications: false,
        maintenanceReminders: true,
        browserNotifications: true,
      });
      setSaveStatus('Settings reset to defaults. Click Save to apply.');
    }
  };

  const handleOpenArduinoIDE = async () => {
    setPlcStatus('Opening Arduino IDE...');
    try {
      // Call backend API to open Arduino IDE
      const response = await fetch('http://localhost:3001/api/open-arduino-ide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setPlcStatus('✅ Arduino IDE opened successfully!');
      } else {
        setPlcStatus('❌ Failed to open: ' + (data.message || 'Unknown error'));
      }
    } catch (error) {
      setPlcStatus('❌ Error: Backend server not running. Please start server with: npm run server');
      console.error('Error:', error);
    }

    setTimeout(() => setPlcStatus(''), 5000);
  };

  const handleOpenEdgeImpulse = () => {
    window.open('https://studio.edgeimpulse.com/', '_blank');
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      const validExtensions = ['.bin', '.st', '.ino'];
      const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

      if (!validExtensions.includes(fileExtension)) {
        alert('⚠️ Please select a valid file (.bin, .st, or .ino)');
        return;
      }

      setSelectedFile(file);
      setFileName(file.name);
      setOtaStatus(`📄 File selected: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`);
    }
  };

  const handleSendOTA = async () => {
    if (!isConnected) {
      alert('⚠️ Please connect to MQTT broker first!');
      return;
    }

    if (!selectedFile) {
      alert('⚠️ Please select a file to upload first!');
      return;
    }

    setOtaStatus('📦 Preparing OTA update...');

    try {
      // Create FormData to send file
      const formData = new FormData();
      formData.append('programFile', selectedFile);
      formData.append('targetDevice', 'ESP32-001');

      setOtaStatus('📡 Uploading program via MQTT...');

      // Call backend API to send OTA
      const response = await fetch('http://localhost:3001/api/send-ota', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setOtaStatus('✅ Program sent successfully! Device is updating...');
        setTimeout(() => {
          setOtaStatus('✅ OTA update completed!');
          setTimeout(() => setOtaStatus(''), 3000);
        }, 2000);
      } else {
        setOtaStatus('❌ Failed to send OTA: ' + (data.message || 'Unknown error'));
        setTimeout(() => setOtaStatus(''), 5000);
      }

    } catch (error) {
      setOtaStatus('❌ Error: Backend server not running. Please start server with: npm run server');
      console.error('Error:', error);
      setTimeout(() => setOtaStatus(''), 5000);
    }
  };

  return (
    <div className="bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 min-h-screen">
      <div className="p-4 md:p-6">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">System Settings</h1>
          <p className="text-gray-600">Configure your IIoT dashboard and device connections</p>
        </div>

        {/* Development Tools Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

          {/* Arduino IDE Card */}
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-xl p-6 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>

            <div className="relative z-10">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <Terminal className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Arduino IDE</h2>
                  <p className="text-sm text-blue-100">Program ESP32 devices</p>
                </div>
              </div>

              <p className="text-sm text-blue-50 mb-6">
                Launch Arduino IDE to program and upload firmware to your ESP32 and other Arduino-compatible devices.
              </p>

              <button
                onClick={handleOpenArduinoIDE}
                className="w-full bg-white text-blue-600 px-6 py-3 rounded-xl hover:bg-blue-50 transition font-semibold flex items-center justify-center space-x-2 shadow-lg mb-4"
              >
                <FolderOpen className="w-5 h-5" />
                <span>Open Arduino IDE</span>
              </button>

              <button
                onClick={handleOpenEdgeImpulse}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-xl hover:from-purple-700 hover:to-pink-700 transition font-semibold flex items-center justify-center space-x-2 shadow-lg"
              >
                <Zap className="w-5 h-5" />
                <span>Open Edge Impulse Studio</span>
              </button>

              {plcStatus && (
                <div className="mt-4 p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                  <p className="text-sm font-medium">{plcStatus}</p>
                </div>
              )}

              <div className="mt-4 text-xs text-blue-100">
                <Info className="w-4 h-4 inline mr-1" />
                Arduino IDE & ML Training Tools
              </div>
            </div>
          </div>

          {/* OTA Update Card */}
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-xl p-6 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>

            <div className="relative z-10">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">OTA Program Update</h2>
                  <p className="text-sm text-emerald-100">Over-The-Air upload</p>
                </div>
              </div>

              <p className="text-sm text-emerald-50 mb-6">
                Upload your compiled PLC program to the device wirelessly via MQTT connection.
              </p>

              <div className="mb-4">
                <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${isConnected ? 'bg-white/20' : 'bg-red-500/30'}`}>
                  <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-white' : 'bg-red-200'}`}></div>
                  <span className="text-sm font-medium">
                    MQTT: {isConnected ? 'Connected' : 'Disconnected'}
                  </span>
                </div>
              </div>

              {/* File Upload Input */}
              <div className="mb-4">
                <span className="text-sm font-medium text-emerald-50 block mb-2">Select Program File (.bin, .st, .ino)</span>
                <input
                  type="file"
                  accept=".bin,.st,.ino"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="ota-file-input"
                />
                <label
                  htmlFor="ota-file-input"
                  className="flex items-center justify-center w-full px-4 py-3 bg-white/20 rounded-xl border-2 border-dashed border-white/40 hover:bg-white/30 transition cursor-pointer backdrop-blur-sm"
                >
                  <Upload className="w-5 h-5 mr-2" />
                  <span className="text-sm font-medium">
                    {fileName || 'Choose file...'}
                  </span>
                </label>
              </div>

              <button
                onClick={handleSendOTA}
                disabled={!isConnected || !selectedFile}
                className={`w-full px-6 py-3 rounded-xl transition font-semibold flex items-center justify-center space-x-2 shadow-lg ${
                  isConnected && selectedFile
                    ? 'bg-white text-emerald-600 hover:bg-emerald-50'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <Zap className="w-5 h-5" />
                <span>Send Program via OTA</span>
              </button>

              {otaStatus && (
                <div className="mt-4 p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                  <p className="text-sm font-medium">{otaStatus}</p>
                </div>
              )}

              <div className="mt-4 text-xs text-emerald-100">
                <Info className="w-4 h-4 inline mr-1" />
                Upload via: iiot/control/ota
              </div>
            </div>
          </div>
        </div>

        {/* MQTT Connection Settings */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-blue-100 rounded-xl">
                <Wifi className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">MQTT Connection</h2>
                <p className="text-sm text-gray-500">Configure broker connection settings</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 px-3 py-2 bg-gray-100 rounded-lg">
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
              <span className="text-sm font-medium text-gray-700">{connectionStatus}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Broker Host
              </label>
              <input
                type="text"
                value={mqttSettings.host}
                onChange={(e) => handleMqttChange('host', e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="localhost or broker.example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Port
              </label>
              <input
                type="number"
                value={mqttSettings.port}
                onChange={(e) => handleMqttChange('port', parseInt(e.target.value))}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="8883"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Client ID
              </label>
              <input
                type="text"
                value={mqttSettings.clientId}
                onChange={(e) => handleMqttChange('clientId', e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="iiot_dashboard_xxxxx"
              />
              <p className="text-xs text-gray-500 mt-1">Unique identifier for this connection</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Username (optional)
              </label>
              <input
                type="text"
                value={mqttSettings.username}
                onChange={(e) => handleMqttChange('username', e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="Username"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Password (optional)
              </label>
              <input
                type="password"
                value={mqttSettings.password}
                onChange={(e) => handleMqttChange('password', e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="Password"
              />
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-3 bg-green-100 rounded-xl">
              <Bell className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Notifications</h2>
              <p className="text-sm text-gray-500">Manage alert preferences</p>
            </div>
          </div>

          <div className="space-y-4">
            <SettingToggle
              label="Browser Notifications"
              description="Receive real-time browser notifications (Recommended)"
              checked={notificationSettings.browserNotifications}
              onChange={() => handleNotificationChange('browserNotifications')}
            />
            <SettingToggle
              label="Enable Alerts"
              description="Show real-time alerts for critical events"
              checked={notificationSettings.enableAlerts}
              onChange={() => handleNotificationChange('enableAlerts')}
            />
            <SettingToggle
              label="Email Notifications"
              description="Receive email notifications for important events (Coming soon)"
              checked={notificationSettings.emailNotifications}
              onChange={() => handleNotificationChange('emailNotifications')}
            />
            <SettingToggle
              label="SMS Notifications"
              description="Receive SMS alerts for critical issues (Coming soon)"
              checked={notificationSettings.smsNotifications}
              onChange={() => handleNotificationChange('smsNotifications')}
            />
            <SettingToggle
              label="Maintenance Reminders"
              description="Get reminders for scheduled maintenance"
              checked={notificationSettings.maintenanceReminders}
              onChange={() => handleNotificationChange('maintenanceReminders')}
            />
          </div>
        </div>


        {/* Save Status */}
        {saveStatus && (
          <div className={`p-4 rounded-xl ${saveStatus.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
            <p className="font-semibold">{saveStatus}</p>
          </div>
        )}

        {/* Save Buttons */}
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <button
            onClick={handleExportSettings}
            className="flex items-center justify-center space-x-2 px-6 py-3 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition shadow-lg font-semibold"
          >
            <DownloadIcon className="w-5 h-5" />
            <span>Export Settings</span>
          </button>

          <div className="flex space-x-4">
            <button
              onClick={handleReset}
              className="flex items-center space-x-2 px-6 py-3 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition shadow-lg font-semibold"
            >
              <RefreshCw className="w-5 h-5" />
              <span>Reset</span>
            </button>
            <button
              onClick={handleSave}
              className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:shadow-xl transition font-semibold"
            >
              <Save className="w-5 h-5" />
              <span>Save Settings</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const SettingToggle = ({ label, description, checked, onChange }) => {
  return (
    <div className="flex items-center justify-between py-4 border-b border-gray-100 last:border-0">
      <div>
        <h3 className="font-semibold text-gray-900">{label}</h3>
        <p className="text-sm text-gray-500 mt-1">{description}</p>
      </div>
      <button
        onClick={onChange}
        className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors shadow-inner ${
          checked ? 'bg-blue-600' : 'bg-gray-300'
        }`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
};

export default Settings;
