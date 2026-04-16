import { useState, useEffect } from 'react';
import { Save, Phone, Settings as SettingsIcon, Sliders, Sun, Moon, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { Layout } from '../components/Layout';
import axiosInstance from '../api/axiosInstance';

interface Thresholds {
  pH_min: number;
  pH_max: number;
  tds: number;
  turbidity: number;
  temperature_min: number;
  temperature_max: number;
  conductivity: number;
}

interface SettingsData {
  phone: string;
  thresholds: Thresholds;
}

export function Settings() {
  const [settings, setSettings] = useState<SettingsData>({
    phone: '',
    thresholds: {
      pH_min: 6.5,
      pH_max: 8.5,
      tds: 500,
      turbidity: 1.0,
      temperature_min: 10,
      temperature_max: 25,
      conductivity: 1000,
    },
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [darkMode, setDarkMode] = useState(document.documentElement.classList.contains('dark'));
  const [phoneError, setPhoneError] = useState<string | null>(null);

  // Load settings on component mount
  useEffect(() => {
    fetchSettings();
  }, []);

  // Update dark mode
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get('/settings');
      const data = response.data;

      setSettings({
        phone: data.phone || '',
        thresholds: data.thresholds || {
          pH_min: 6.5,
          pH_max: 8.5,
          tds: 500,
          turbidity: 1.0,
          temperature_min: 10,
          temperature_max: 25,
          conductivity: 1000,
        },
      });

      // Set dark mode from local storage if available
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme === 'dark') {
        setDarkMode(true);
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      setFeedback({
        type: 'error',
        message: 'Failed to load settings. Using default values.',
      });
    } finally {
      setLoading(false);
    }
  };

  const validatePhone = (phone: string): boolean => {
    if (!phone) return true; // Optional field
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length >= 10;
  };

  const handlePhoneChange = (value: string) => {
    setSettings((prev) => ({ ...prev, phone: value }));
    if (value && !validatePhone(value)) {
      setPhoneError('Phone number must have at least 10 digits');
    } else {
      setPhoneError(null);
    }
  };

  const handleThresholdChange = (key: keyof Thresholds, value: string) => {
    const numValue = parseFloat(value);
    setSettings((prev) => ({
      ...prev,
      thresholds: {
        ...prev.thresholds,
        [key]: isNaN(numValue) ? 0 : numValue,
      },
    }));
  };

  const handleSave = async () => {
    if (phoneError) {
      setFeedback({
        type: 'error',
        message: 'Please fix validation errors before saving',
      });
      return;
    }

    try {
      setSaving(true);
      await axiosInstance.post('/settings', {
        phone: settings.phone,
        thresholds: settings.thresholds,
      });

      setFeedback({
        type: 'success',
        message: 'Settings saved successfully!',
      });

      setTimeout(() => setFeedback(null), 3000);
    } catch (error) {
      console.error('Failed to save settings:', error);
      setFeedback({
        type: 'error',
        message: 'Failed to save settings. Please try again.',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout title="Settings" subtitle="Configure system preferences and parameters">
        <div className="flex items-center justify-center py-20">
          <Loader className="h-12 w-12 animate-spin text-blue-600" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Settings" subtitle="Configure system preferences and parameters">
      {/* Header with Save Button */}
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">IoT Water Monitoring Dashboard</h3>
        <button
          onClick={handleSave}
          disabled={saving || !!phoneError}
          className="flex items-center gap-2 rounded-lg bg-blue-600 dark:bg-blue-700 px-6 py-2.5 font-medium text-white shadow-lg hover:shadow-xl hover:bg-blue-700 dark:hover:bg-blue-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? (
            <Loader className="h-5 w-5 animate-spin" />
          ) : (
            <Save className="h-5 w-5" />
          )}
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      {/* Feedback Messages */}
      {feedback && (
        <div
          className={`mb-6 rounded-lg border px-4 py-4 flex items-center gap-3 shadow-sm transition-all ${
            feedback.type === 'success'
              ? 'border-green-200 dark:border-green-900/50 bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-300'
              : 'border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-300'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle className="h-5 w-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
          )}
          <span className="font-medium">{feedback.message}</span>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* User Settings Section */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-md dark:shadow-lg hover:shadow-lg dark:hover:shadow-xl transition-all lg:col-span-1">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-lg bg-blue-100 dark:bg-blue-900/40 p-2 shadow-sm">
              <SettingsIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-white">User Settings</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">Personal preferences</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Phone Number Input */}
            <div>
              <label htmlFor="phone" className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <Phone className="h-4 w-4" />
                Phone Number (SMS Alerts)
              </label>
              <input
                id="phone"
                type="tel"
                placeholder="+1 (555) 123-4567"
                value={settings.phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                className={`w-full rounded-lg border px-3 py-2.5 text-gray-900 dark:text-white focus:outline-none focus:ring-2 transition-all dark:bg-gray-700/50 ${
                  phoneError
                    ? 'border-red-400 focus:ring-red-500'
                    : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500'
                }`}
              />
              {phoneError && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{phoneError}</p>}
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Format: 10+ digits (optional)</p>
            </div>
          </div>
        </div>

        {/* Theme Settings Section */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-md dark:shadow-lg hover:shadow-lg dark:hover:shadow-xl transition-all lg:col-span-1">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-lg bg-purple-100 dark:bg-purple-900/40 p-2 shadow-sm">
              {darkMode ? (
                <Moon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              ) : (
                <Sun className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              )}
            </div>
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-white">Theme Settings</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">Display preferences</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Dark Mode Toggle */}
            <div className="flex items-center justify-between">
              <label htmlFor="darkMode" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Dark Mode
              </label>
              <button
                id="darkMode"
                onClick={() => {
                  setDarkMode(!darkMode);
                  localStorage.setItem('theme', !darkMode ? 'dark' : 'light');
                }}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                  darkMode ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform ${
                    darkMode ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* System Status Section */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-md dark:shadow-lg hover:shadow-lg dark:hover:shadow-xl transition-all lg:col-span-1">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-lg bg-green-100 dark:bg-green-900/40 p-2 shadow-sm">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-white">System Status</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">Connection status</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-lg bg-gray-50 dark:bg-gray-700/50 p-3">
              <span className="text-sm text-gray-600 dark:text-gray-300">Backend API</span>
              <span className="inline-block h-2 w-2 rounded-full bg-green-500"></span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-gray-50 dark:bg-gray-700/50 p-3">
              <span className="text-sm text-gray-600 dark:text-gray-300">Database</span>
              <span className="inline-block h-2 w-2 rounded-full bg-green-500"></span>
            </div>
          </div>
        </div>
      </div>

      {/* Threshold Settings Section */}
      <div className="mt-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-md dark:shadow-lg hover:shadow-lg dark:hover:shadow-xl transition-all">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-lg bg-yellow-100 dark:bg-yellow-900/40 p-2 shadow-sm">
            <Sliders className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white">Water Quality Thresholds</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Critical alert limits for sensor readings</p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {/* pH Min & Max */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">pH Level</h3>
            <div>
              <label htmlFor="pH_min" className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                Min
              </label>
              <input
                id="pH_min"
                type="number"
                value={settings.thresholds.pH_min}
                onChange={(e) => handleThresholdChange('pH_min', e.target.value)}
                step="0.1"
                min="0"
                max="14"
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/50 px-3 py-2 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all"
              />
            </div>
            <div>
              <label htmlFor="pH_max" className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                Max
              </label>
              <input
                id="pH_max"
                type="number"
                value={settings.thresholds.pH_max}
                onChange={(e) => handleThresholdChange('pH_max', e.target.value)}
                step="0.1"
                min="0"
                max="14"
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/50 px-3 py-2 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all"
              />
            </div>
          </div>

          {/* TDS Threshold */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">TDS (ppm)</h3>
            <div>
              <label htmlFor="tds" className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                Max
              </label>
              <input
                id="tds"
                type="number"
                value={settings.thresholds.tds}
                onChange={(e) => handleThresholdChange('tds', e.target.value)}
                step="10"
                min="0"
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/50 px-3 py-2 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Total Dissolved Solids</p>
            </div>
          </div>

          {/* Turbidity Threshold */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Turbidity (NTU)</h3>
            <div>
              <label htmlFor="turbidity" className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                Max
              </label>
              <input
                id="turbidity"
                type="number"
                value={settings.thresholds.turbidity}
                onChange={(e) => handleThresholdChange('turbidity', e.target.value)}
                step="0.1"
                min="0"
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/50 px-3 py-2 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Water clarity</p>
            </div>
          </div>

          {/* Conductivity Threshold */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Conductivity (µS/cm)</h3>
            <div>
              <label htmlFor="conductivity" className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                Max
              </label>
              <input
                id="conductivity"
                type="number"
                value={settings.thresholds.conductivity}
                onChange={(e) => handleThresholdChange('conductivity', e.target.value)}
                step="50"
                min="0"
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/50 px-3 py-2 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all"
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Electrical conductivity</p>
            </div>
          </div>

          {/* Temperature Min & Max */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Temperature (°C)</h3>
            <div>
              <label htmlFor="temperature_min" className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                Min
              </label>
              <input
                id="temperature_min"
                type="number"
                value={settings.thresholds.temperature_min}
                onChange={(e) => handleThresholdChange('temperature_min', e.target.value)}
                step="0.1"
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/50 px-3 py-2 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all"
              />
            </div>
            <div>
              <label htmlFor="temperature_max" className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                Max
              </label>
              <input
                id="temperature_max"
                type="number"
                value={settings.thresholds.temperature_max}
                onChange={(e) => handleThresholdChange('temperature_max', e.target.value)}
                step="0.1"
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/50 px-3 py-2 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-6 rounded-lg border border-blue-200 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-900/20 p-4">
          <p className="text-sm text-blue-800 dark:text-blue-300">
            <span className="font-semibold">ℹ️ Note:</span> These thresholds trigger critical alerts when sensor readings exceed the configured limits. Adjust based on your water quality standards and system requirements.
          </p>
        </div>
      </div>
    </Layout>
  );
}
