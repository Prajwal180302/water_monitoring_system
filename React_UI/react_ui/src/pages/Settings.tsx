import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  Bell,
  CheckCircle,
  Globe,
  HelpCircle,
  Loader,
  LogOut,
  Mail,
  Moon,
  Phone,
  Save,
  Settings as SettingsIcon,
  ShieldCheck,
  Sliders,
  TimerReset,
  User,
  Wifi,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import { Layout } from '../components/Layout';
import { useAppSettings } from '../context/AppSettingsContext';
import { useTheme } from '../context/ThemeContext';
import { formatSamplingInterval, getSetting, mergeAppSettings, saveSetting, USER_PROFILE_STORAGE_KEY } from '../utils/appSettings';
import type { AppSettings, LanguageOption, LayoutOption, SyncMode, TemperatureUnit } from '../utils/appSettings';
import { translate } from '../utils/translations';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const validLanguages: LanguageOption[] = ['en', 'hi', 'mr'];
const supportEmail = 'prajwalshingote180302@gmail.com';

const createFeedback = (type: 'success' | 'error', message: string) => ({ type, message });

const normalizeAccount = (account: AppSettings['account']) => ({
  name: account.name.trim(),
  email: account.email.trim().toLowerCase(),
  phone: account.phone.trim(),
  language: account.language,
});

const validateAccount = (account: AppSettings['account']) => {
  const name = account.name.trim();
  const email = account.email.trim();
  const phone = account.phone.trim();

  if (!name) return 'Name is required.';
  if (name.length < 2) return 'Name must be at least 2 characters.';
  if (name.length > 100) return 'Name must be 100 characters or fewer.';
  if (!/^[A-Za-z\s.'-]+$/.test(name)) return 'Name can only contain letters, spaces, apostrophes, periods, and hyphens.';
  if (!emailPattern.test(email)) return 'Enter a valid email address.';
  if (phone) {
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10 || digits.length > 15) return 'Phone number must contain 10 to 15 digits.';
  }
  if (!validLanguages.includes(account.language)) return 'Select a valid language.';

  return null;
};

const validateSettings = (settings: AppSettings) => {
  const errors: string[] = [];

  const accountError = validateAccount(settings.account);
  if (accountError) errors.push(accountError);

  if (settings.system.thresholds.pH_min < 0 || settings.system.thresholds.pH_max > 14) {
    errors.push('pH values must stay between 0 and 14.');
  }
  if (settings.system.thresholds.pH_min >= settings.system.thresholds.pH_max) {
    errors.push('pH minimum must be lower than pH maximum.');
  }
  if (settings.system.samplingInterval < 1 || settings.system.samplingInterval > 3600) {
    errors.push('Sampling interval must be between 1 and 3600 seconds.');
  }

  ['tds', 'turbidity', 'conductivity', 'temperature_min', 'temperature_max'].forEach((key) => {
    const value = settings.system.thresholds[key as keyof typeof settings.system.thresholds];
    if (typeof value === 'number' && value < 0) {
      errors.push(`${key.replace('_', ' ')} cannot be negative.`);
    }
  });

  ['ph', 'tds', 'turbidity', 'conductivity'].forEach((key) => {
    const value = settings.system.calibration[key as keyof typeof settings.system.calibration];
    if (!Number.isFinite(value)) {
      errors.push(`${key.toUpperCase()} calibration must be a valid number.`);
    }
  });

  return errors;
};

export function Settings() {
  const navigate = useNavigate();
  const { settings, replaceSettings } = useAppSettings();
  const { darkMode, setDarkMode } = useTheme();
  const hasHydratedFromApi = useRef(false);

  const [draft, setDraft] = useState<AppSettings>(settings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingPhone, setSavingPhone] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savedPhone, setSavedPhone] = useState(settings.account.phone.trim());
  const [savedAccount, setSavedAccount] = useState(() => normalizeAccount(settings.account));
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const t = (key: Parameters<typeof translate>[1]) => translate(draft.account.language, key);
  const supportMailto = `mailto:${supportEmail}?subject=${encodeURIComponent('Water Monitoring Support Request')}&body=${encodeURIComponent(
    `Hello Support,\n\nI need help with the Water Monitoring System.\n\nName: ${draft.account.name || ''}\nEmail: ${draft.account.email || ''}\nDevice ID: ${draft.connectivity.deviceId || ''}\nIssue:\n`
  )}`;

  useEffect(() => {
    setDraft(settings);
    setLoading(false);
  }, [settings]);

  useEffect(() => {
    document.documentElement.lang = settings.account.language;
  }, [settings.account.language]);

  useEffect(() => {
    if (hasHydratedFromApi.current) {
      return;
    }

    const hydrateSettings = async () => {
      try {
        const [settingsResponse, profileResponse] = await Promise.all([
          axiosInstance.get('/settings'),
          axiosInstance.get('/profile'),
        ]);
        const apiSettings = settingsResponse.data;
        const profileUser = profileResponse.data?.user ?? {};
        const storedProfile = getSetting(USER_PROFILE_STORAGE_KEY, settings.account);

        const merged = mergeAppSettings({
          ...settings,
          account: {
            ...storedProfile,
            name: profileUser?.name ?? storedProfile.name,
            email: profileUser?.email ?? storedProfile.email,
            phone: apiSettings?.phone ?? profileUser?.phone ?? settings.account.phone,
            language: apiSettings?.language ?? profileUser?.language ?? storedProfile.language,
          },
          system: {
            ...settings.system,
            thresholds: {
              ...settings.system.thresholds,
              ...(apiSettings?.thresholds ?? {}),
            },
            calibration: {
              ...settings.system.calibration,
              ...(apiSettings?.calibration ?? {}),
            },
            samplingInterval: apiSettings?.samplingInterval ?? settings.system.samplingInterval,
            deviceStatus: apiSettings?.deviceStatus ?? settings.system.deviceStatus,
          },
        });

        replaceSettings(merged);
        setDraft(merged);
        setSavedPhone((merged.account.phone || '').trim());
        setSavedAccount(normalizeAccount(merged.account));
      } catch (error) {
        console.warn('Settings API load skipped:', error);
      } finally {
        hasHydratedFromApi.current = true;
      }
    };

    hydrateSettings();
  }, [replaceSettings, settings]);

  const activeSummary = useMemo(() => ({
    notifications: draft.preferences.notificationsEnabled ? 'Enabled' : 'Disabled',
    clock: draft.preferences.liveTimeEnabled ? 'Visible on dashboard' : 'Hidden on dashboard',
    sync: draft.connectivity.cloudSyncEnabled ? 'Cloud sync enabled' : 'Cloud sync paused',
  }), [draft]);

  const liveSummaryItems = useMemo(() => {
    const languageNames: Record<LanguageOption, string> = {
      en: 'English',
      hi: 'Hindi',
      mr: 'Marathi',
    };

    return [
      { label: 'Language', value: languageNames[draft.account.language] },
      { label: 'Notifications', value: activeSummary.notifications },
      { label: 'Dashboard Clock', value: activeSummary.clock },
      { label: 'Theme', value: darkMode ? 'Dark' : 'Light' },
      { label: 'Temperature Unit', value: `°${draft.preferences.temperatureUnit}` },
      { label: 'Layout', value: draft.preferences.layout },
      { label: 'Cloud Sync', value: activeSummary.sync },
      { label: 'Sync Mode', value: draft.connectivity.syncMode },
      { label: 'Sampling', value: formatSamplingInterval(draft.system.samplingInterval) },
      { label: 'Device Status', value: draft.system.deviceStatus },
    ];
  }, [activeSummary.clock, activeSummary.notifications, activeSummary.sync, darkMode, draft]);

  const updateDraftAndPersist = (updates: Partial<AppSettings>) => {
    const next = mergeAppSettings({ ...draft, ...updates });
    setDraft(next);
    replaceSettings(next);
    saveSetting(USER_PROFILE_STORAGE_KEY, next.account);
  };

  const updateAccount = (key: keyof AppSettings['account'], value: string) => {
    updateDraftAndPersist({ account: { ...draft.account, [key]: value } });
  };

  const updatePreferences = (key: keyof AppSettings['preferences'], value: boolean | string) => {
    updateDraftAndPersist({ preferences: { ...draft.preferences, [key]: value } });
  };

  const updateThreshold = (key: keyof AppSettings['system']['thresholds'], value: string) => {
    const nextValue = Number(value);
    updateDraftAndPersist({
      system: {
        ...draft.system,
        thresholds: {
          ...draft.system.thresholds,
          [key]: Number.isFinite(nextValue) ? nextValue : 0,
        },
      },
    });
  };

  const updateCalibration = (key: keyof AppSettings['system']['calibration'], value: string) => {
    const nextValue = Number(value);
    updateDraftAndPersist({
      system: {
        ...draft.system,
        calibration: {
          ...draft.system.calibration,
          [key]: Number.isFinite(nextValue) ? nextValue : 0,
        },
      },
    });
  };

  const updateSystem = (
    key: 'samplingInterval' | 'deviceStatus',
    value: number | AppSettings['system']['deviceStatus']
  ) => {
    updateDraftAndPersist({ system: { ...draft.system, [key]: value } });
  };

  const updateConnectivity = (
    key: keyof Omit<AppSettings['connectivity'], 'lastSync' | 'deviceId' | 'firmwareVersion'>,
    value: string | boolean
  ) => {
    updateDraftAndPersist({ connectivity: { ...draft.connectivity, [key]: value } });
  };

  const handleDarkModeToggle = () => {
    const next = !darkMode;
    setDarkMode(next);
    updateDraftAndPersist({
      preferences: {
        ...draft.preferences,
        darkModeEnabled: next,
      },
    });
  };

  const handleLogout = () => {
    sessionStorage.clear();
    localStorage.clear();
    navigate('/login');
  };

  const handleSavePhone = async () => {
    const phone = draft.account.phone.trim();
    const digits = phone.replace(/\D/g, '');

    if (phone && (digits.length < 10 || digits.length > 15)) {
      setFeedback(createFeedback('error', 'Phone number must contain 10 to 15 digits.'));
      return;
    }

    const accountError = validateAccount(draft.account);
    if (accountError) {
      setFeedback(createFeedback('error', accountError));
      return;
    }

    if (phone === savedPhone) {
      setFeedback(createFeedback('error', t('phoneAlreadyAdded')));
      window.setTimeout(() => setFeedback(null), 3000);
      return;
    }

    try {
      setSavingPhone(true);

      const nextSettings = mergeAppSettings({
        ...draft,
        account: {
          ...draft.account,
          phone,
        },
      });

      await Promise.all([
        axiosInstance.put('/profile', {
          name: nextSettings.account.name,
          email: nextSettings.account.email,
          phone: nextSettings.account.phone,
          language: nextSettings.account.language,
        }),
        axiosInstance.post('/settings', {
          name: nextSettings.account.name,
          email: nextSettings.account.email,
          phone: nextSettings.account.phone,
          language: nextSettings.account.language,
          thresholds: nextSettings.system.thresholds,
          calibration: nextSettings.system.calibration,
          samplingInterval: nextSettings.system.samplingInterval,
          deviceStatus: nextSettings.system.deviceStatus,
        }),
      ]);

      replaceSettings(nextSettings);
      saveSetting(USER_PROFILE_STORAGE_KEY, nextSettings.account);
      setDraft(nextSettings);
      setSavedPhone(phone);
      setSavedAccount(normalizeAccount(nextSettings.account));
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
      setFeedback(createFeedback('success', t('phoneAdded')));
      window.setTimeout(() => setFeedback(null), 3000);
    } catch (error) {
      console.error('Failed to save phone number:', error);
      setFeedback(createFeedback('error', 'Failed to save phone number. Please try again.'));
    } finally {
      setSavingPhone(false);
    }
  };

  const handleSaveProfile = async () => {
    const accountError = validateAccount(draft.account);
    if (accountError) {
      setFeedback(createFeedback('error', accountError));
      return;
    }

    const normalizedDraft = normalizeAccount(draft.account);
    if (JSON.stringify(normalizedDraft) === JSON.stringify(savedAccount)) {
      setFeedback(createFeedback('error', t('profileAlreadyAdded')));
      window.setTimeout(() => setFeedback(null), 3000);
      return;
    }

    try {
      setSavingProfile(true);

      const nextSettings = mergeAppSettings({
        ...draft,
        account: {
          ...draft.account,
          name: normalizedDraft.name,
          email: normalizedDraft.email,
          phone: normalizedDraft.phone,
          language: normalizedDraft.language,
        },
      });

      await Promise.all([
        axiosInstance.put('/profile', {
          name: nextSettings.account.name,
          email: nextSettings.account.email,
          phone: nextSettings.account.phone,
          language: nextSettings.account.language,
        }),
        axiosInstance.post('/settings', {
          name: nextSettings.account.name,
          email: nextSettings.account.email,
          phone: nextSettings.account.phone,
          language: nextSettings.account.language,
          thresholds: nextSettings.system.thresholds,
          calibration: nextSettings.system.calibration,
          samplingInterval: nextSettings.system.samplingInterval,
          deviceStatus: nextSettings.system.deviceStatus,
        }),
      ]);

      replaceSettings(nextSettings);
      saveSetting(USER_PROFILE_STORAGE_KEY, nextSettings.account);
      setDraft(nextSettings);
      setSavedPhone(nextSettings.account.phone.trim());
      setSavedAccount(normalizeAccount(nextSettings.account));
      setFeedback(createFeedback('success', t('profileAdded')));
      window.setTimeout(() => setFeedback(null), 3000);
    } catch (error) {
      console.error('Failed to save profile:', error);
      setFeedback(createFeedback('error', 'Failed to save profile. Please check each field and try again.'));
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSave = async () => {
    const errors = validateSettings(draft);
    if (errors.length > 0) {
      setFeedback(createFeedback('error', errors[0]));
      return;
    }

    try {
      setSaving(true);

      const nextSettings = mergeAppSettings({
        ...draft,
        preferences: {
          ...draft.preferences,
          darkModeEnabled: darkMode,
        },
        connectivity: {
          ...draft.connectivity,
          lastSync: new Date().toLocaleString(),
        },
      });

      replaceSettings(nextSettings);
      saveSetting(USER_PROFILE_STORAGE_KEY, nextSettings.account);

      await Promise.all([
        axiosInstance.put('/profile', {
          name: nextSettings.account.name,
          email: nextSettings.account.email,
          phone: nextSettings.account.phone,
          language: nextSettings.account.language,
        }),
        axiosInstance.post('/settings', {
          name: nextSettings.account.name,
          email: nextSettings.account.email,
          phone: nextSettings.account.phone,
          language: nextSettings.account.language,
          thresholds: nextSettings.system.thresholds,
          calibration: nextSettings.system.calibration,
          samplingInterval: nextSettings.system.samplingInterval,
          deviceStatus: nextSettings.system.deviceStatus,
        }),
      ]);

      setDraft(nextSettings);
      setSavedPhone(nextSettings.account.phone.trim());
      setSavedAccount(normalizeAccount(nextSettings.account));
      setFeedback(createFeedback('success', t('settingsSaved')));
      window.setTimeout(() => setFeedback(null), 3000);
    } catch (error) {
      console.error('Failed to save settings:', error);
      setFeedback(createFeedback('error', 'Failed to save settings. Please try again.'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout title={t('settingsTitle')} subtitle={t('settingsSubtitle')}>
        <div className="flex items-center justify-center py-20">
          <Loader className="h-12 w-12 animate-spin text-blue-600" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={t('settingsTitle')} subtitle={t('settingsSubtitle')}>
      <div className="mb-6 flex items-center justify-between rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-sky-50 to-emerald-50 p-5 shadow-lg dark:border-slate-700/80 dark:from-slate-900 dark:via-slate-900 dark:to-emerald-950/20">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('dashboardName')}</h3>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{t('settingsIntro')}</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-sky-600 to-blue-600 px-6 py-2.5 font-medium text-white shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? <Loader className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
          {saving ? t('saving') : t('saveChanges')}
        </button>
      </div>

      {feedback && (
        <div
          className={`mb-6 flex items-center gap-3 rounded-2xl border px-4 py-4 shadow-md transition-all ${
            feedback.type === 'success'
              ? 'border-green-200 dark:border-green-900/50 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 text-green-800 dark:text-green-300'
              : 'border-red-200 dark:border-red-900/50 bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 text-red-800 dark:text-red-300'
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

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-3xl border border-sky-200 bg-gradient-to-br from-white via-sky-50 to-blue-50 p-6 shadow-lg transition-all dark:border-sky-900/40 dark:from-slate-900 dark:via-slate-900 dark:to-sky-950/20">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-lg bg-blue-100 p-2 shadow-sm dark:bg-blue-900/40">
              <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-white">{t('account')}</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">{t('accountSubtitle')}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">{t('fullName')}</label>
              <input
                id="name"
                type="text"
                value={draft.account.name}
                onChange={(e) => updateAccount('name', e.target.value)}
                className="w-full rounded-2xl border border-gray-300 bg-white px-3 py-2.5 text-gray-900 transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700/50 dark:text-white"
              />
            </div>
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">{t('email')}</label>
              <input
                id="email"
                type="email"
                value={draft.account.email}
                onChange={(e) => updateAccount('email', e.target.value)}
                className="w-full rounded-2xl border border-gray-300 bg-white px-3 py-2.5 text-gray-900 transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700/50 dark:text-white"
              />
            </div>
            <div>
              <label htmlFor="language" className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <Globe className="h-4 w-4" />
                {t('language')}
              </label>
              <select
                id="language"
                value={draft.account.language}
                onChange={(e) => updateAccount('language', e.target.value as LanguageOption)}
                className="w-full rounded-2xl border border-gray-300 bg-white px-3 py-2.5 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700/50 dark:text-white"
              >
                <option value="en">English</option>
                <option value="hi">हिन्दी</option>
                <option value="mr">मराठी</option>
              </select>
            </div>
            <div>
              <label htmlFor="phone" className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <Phone className="h-4 w-4" />
                {t('phoneNumber')}
              </label>
              <input
                id="phone"
                type="tel"
                value={draft.account.phone}
                onChange={(e) => updateAccount('phone', e.target.value)}
                className="w-full rounded-2xl border border-gray-300 bg-white px-3 py-2.5 text-gray-900 transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700/50 dark:text-white"
              />
              <button
                type="button"
                onClick={handleSavePhone}
                disabled={savingPhone || !draft.account.phone.trim()}
                className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {savingPhone ? <Loader className="h-4 w-4 animate-spin" /> : <Phone className="h-4 w-4" />}
                {savingPhone
                  ? t('saving')
                  : draft.account.phone.trim() === savedPhone
                    ? t('phoneAddedButton')
                    : draft.account.phone.trim()
                      ? t('addUpdatePhone')
                      : t('enterPhoneNumber')}
              </button>
            </div>
            <button
              type="button"
              onClick={handleSaveProfile}
              disabled={savingProfile}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {savingProfile ? <Loader className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {savingProfile ? t('savingProfile') : t('saveProfile')}
            </button>
            <button
              onClick={handleLogout}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-600 shadow-sm transition-all hover:-translate-y-0.5 hover:bg-red-50 dark:border-red-900/60 dark:bg-slate-900 dark:text-red-300 dark:hover:bg-red-950/40"
            >
              <LogOut className="h-4 w-4" />
              {t('logout')}
            </button>
          </div>
        </div>

        <div className="rounded-3xl border border-violet-200 bg-gradient-to-br from-white via-violet-50 to-fuchsia-50 p-6 shadow-lg transition-all dark:border-violet-900/40 dark:from-slate-900 dark:via-slate-900 dark:to-violet-950/20">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-lg bg-purple-100 p-2 shadow-sm dark:bg-purple-900/40">
              <SettingsIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-white">{t('preferences')}</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">{t('preferencesSubtitle')}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-2xl bg-white/70 p-3 shadow-sm dark:bg-slate-900/60">
              <div>
                <p className="text-sm font-medium text-gray-800 dark:text-white">{t('notifications')}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{activeSummary.notifications}</p>
              </div>
              <button
                onClick={() => updatePreferences('notificationsEnabled', !draft.preferences.notificationsEnabled)}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                  draft.preferences.notificationsEnabled ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform ${
                    draft.preferences.notificationsEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between rounded-2xl bg-white/70 p-3 shadow-sm dark:bg-slate-900/60">
              <div>
                <p className="text-sm font-medium text-gray-800 dark:text-white">{t('darkMode')}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Applies instantly across the app</p>
              </div>
              <button
                onClick={handleDarkModeToggle}
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

            <div className="flex items-center justify-between rounded-2xl bg-white/70 p-3 shadow-sm dark:bg-slate-900/60">
              <div>
                <p className="text-sm font-medium text-gray-800 dark:text-white">{t('liveTimeDisplay')}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{activeSummary.clock}</p>
              </div>
              <button
                onClick={() => updatePreferences('liveTimeEnabled', !draft.preferences.liveTimeEnabled)}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                  draft.preferences.liveTimeEnabled ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform ${
                    draft.preferences.liveTimeEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div>
              <label htmlFor="temperatureUnit" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">{t('temperatureUnit')}</label>
              <select
                id="temperatureUnit"
                value={draft.preferences.temperatureUnit}
                onChange={(e) => updatePreferences('temperatureUnit', e.target.value as TemperatureUnit)}
                className="w-full rounded-2xl border border-gray-300 bg-white px-3 py-2.5 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700/50 dark:text-white"
              >
                <option value="C">Celsius (°C)</option>
                <option value="F">Fahrenheit (°F)</option>
              </select>
            </div>

            <div>
              <label htmlFor="layoutOption" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">{t('layoutDensity')}</label>
              <select
                id="layoutOption"
                value={draft.preferences.layout}
                onChange={(e) => updatePreferences('layout', e.target.value as LayoutOption)}
                className="w-full rounded-2xl border border-gray-300 bg-white px-3 py-2.5 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700/50 dark:text-white"
              >
                <option value="comfortable">Comfortable</option>
                <option value="compact">Compact</option>
              </select>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-white/70 p-3 shadow-sm dark:bg-slate-900/60">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-800 dark:text-white">
                  <Moon className="h-4 w-4" />
                  Theme
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{darkMode ? 'Dark enabled' : 'Light enabled'}</p>
              </div>
              <div className="rounded-2xl bg-white/70 p-3 shadow-sm dark:bg-slate-900/60">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-800 dark:text-white">
                  <Bell className="h-4 w-4" />
                  Alerts
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{draft.preferences.tdsUnit} / {draft.preferences.turbidityUnit}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-emerald-200 bg-gradient-to-br from-white via-emerald-50 to-lime-50 p-6 shadow-lg transition-all dark:border-emerald-900/40 dark:from-slate-900 dark:via-slate-900 dark:to-emerald-950/20">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-lg bg-green-100 p-2 shadow-sm dark:bg-green-900/40">
              <ShieldCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-white">{t('connectivity')}</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">{t('connectivitySubtitle')}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="wifiName" className="mb-2 flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <Wifi className="h-4 w-4" />
                WiFi Name
              </label>
              <input
                id="wifiName"
                type="text"
                value={draft.connectivity.wifiName}
                onChange={(e) => updateConnectivity('wifiName', e.target.value)}
                className="w-full rounded-2xl border border-gray-300 bg-white px-3 py-2.5 text-gray-900 transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700/50 dark:text-white"
              />
            </div>
            <div>
              <label htmlFor="syncMode" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Sync Mode</label>
              <select
                id="syncMode"
                value={draft.connectivity.syncMode}
                onChange={(e) => updateConnectivity('syncMode', e.target.value as SyncMode)}
                className="w-full rounded-2xl border border-gray-300 bg-white px-3 py-2.5 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700/50 dark:text-white"
              >
                <option value="wifi">WiFi</option>
                <option value="cloud">Cloud</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </div>
            <div className="flex items-center justify-between rounded-2xl bg-white/70 p-3 shadow-sm dark:bg-slate-900/60">
              <div>
                <p className="text-sm font-medium text-gray-800 dark:text-white">Cloud Sync</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{activeSummary.sync}</p>
              </div>
              <button
                onClick={() => updateConnectivity('cloudSyncEnabled', !draft.connectivity.cloudSyncEnabled)}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                  draft.connectivity.cloudSyncEnabled ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform ${
                    draft.connectivity.cloudSyncEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            <div className="rounded-2xl bg-white/70 p-3 shadow-sm dark:bg-slate-900/60">
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">System Info</p>
              <p className="mt-2 text-sm text-gray-800 dark:text-white">Device ID: {draft.connectivity.deviceId}</p>
              <p className="mt-1 text-sm text-gray-800 dark:text-white">Firmware: {draft.connectivity.firmwareVersion}</p>
              <p className="mt-1 text-sm text-gray-800 dark:text-white">Last Sync: {draft.connectivity.lastSync}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.7fr_1fr]">
        <div className="rounded-3xl border border-amber-200 bg-gradient-to-br from-white via-amber-50 to-orange-50 p-6 shadow-lg transition-all dark:border-amber-900/40 dark:from-slate-900 dark:via-slate-900 dark:to-amber-950/20">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-lg bg-yellow-100 p-2 shadow-sm dark:bg-yellow-900/40">
              <Sliders className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-white">{t('systemConfiguration')}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('systemConfigurationSubtitle')}</p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-3 rounded-2xl border border-white/70 bg-white/70 p-4 shadow-sm dark:border-slate-700/70 dark:bg-slate-900/60">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">pH Thresholds</h3>
              <input id="pH_min" type="number" value={draft.system.thresholds.pH_min} onChange={(e) => updateThreshold('pH_min', e.target.value)} step="0.1" min="0" max="14" className="w-full rounded-2xl border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700/50 dark:text-white" />
              <input id="pH_max" type="number" value={draft.system.thresholds.pH_max} onChange={(e) => updateThreshold('pH_max', e.target.value)} step="0.1" min="0" max="14" className="w-full rounded-2xl border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700/50 dark:text-white" />
              <input id="calibration_ph" type="number" value={draft.system.calibration.ph} onChange={(e) => updateCalibration('ph', e.target.value)} step="0.1" className="w-full rounded-2xl border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700/50 dark:text-white" />
            </div>

            <div className="space-y-3 rounded-2xl border border-white/70 bg-white/70 p-4 shadow-sm dark:border-slate-700/70 dark:bg-slate-900/60">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">TDS</h3>
              <input id="tds" type="number" value={draft.system.thresholds.tds} onChange={(e) => updateThreshold('tds', e.target.value)} step="10" min="0" className="w-full rounded-2xl border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700/50 dark:text-white" />
              <input id="calibration_tds" type="number" value={draft.system.calibration.tds} onChange={(e) => updateCalibration('tds', e.target.value)} step="1" className="w-full rounded-2xl border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700/50 dark:text-white" />
            </div>

            <div className="space-y-3 rounded-2xl border border-white/70 bg-white/70 p-4 shadow-sm dark:border-slate-700/70 dark:bg-slate-900/60">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Turbidity</h3>
              <input id="turbidity" type="number" value={draft.system.thresholds.turbidity} onChange={(e) => updateThreshold('turbidity', e.target.value)} step="0.1" min="0" className="w-full rounded-2xl border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700/50 dark:text-white" />
              <input id="calibration_turbidity" type="number" value={draft.system.calibration.turbidity} onChange={(e) => updateCalibration('turbidity', e.target.value)} step="0.1" className="w-full rounded-2xl border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700/50 dark:text-white" />
            </div>

            <div className="space-y-3 rounded-2xl border border-white/70 bg-white/70 p-4 shadow-sm dark:border-slate-700/70 dark:bg-slate-900/60">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Conductivity</h3>
              <input id="conductivity" type="number" value={draft.system.thresholds.conductivity} onChange={(e) => updateThreshold('conductivity', e.target.value)} step="50" min="0" className="w-full rounded-2xl border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700/50 dark:text-white" />
              <input id="calibration_conductivity" type="number" value={draft.system.calibration.conductivity} onChange={(e) => updateCalibration('conductivity', e.target.value)} step="1" className="w-full rounded-2xl border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700/50 dark:text-white" />
            </div>

            <div className="space-y-3 rounded-2xl border border-white/70 bg-white/70 p-4 shadow-sm dark:border-slate-700/70 dark:bg-slate-900/60">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Temperature Range</h3>
              <input id="temperature_min" type="number" value={draft.system.thresholds.temperature_min} onChange={(e) => updateThreshold('temperature_min', e.target.value)} step="0.1" className="w-full rounded-2xl border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700/50 dark:text-white" />
              <input id="temperature_max" type="number" value={draft.system.thresholds.temperature_max} onChange={(e) => updateThreshold('temperature_max', e.target.value)} step="0.1" className="w-full rounded-2xl border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700/50 dark:text-white" />
            </div>

            <div className="space-y-3 rounded-2xl border border-white/70 bg-white/70 p-4 shadow-sm dark:border-slate-700/70 dark:bg-slate-900/60">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Sampling</h3>
              <input
                id="samplingInterval"
                type="number"
                value={draft.system.samplingInterval}
                onChange={(e) => updateSystem('samplingInterval', Number(e.target.value))}
                min="1"
                max="3600"
                className="w-full rounded-2xl border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700/50 dark:text-white"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">Interval in seconds. Default is 1800 seconds (30 min).</p>
            </div>

            <div className="space-y-3 rounded-2xl border border-white/70 bg-white/70 p-4 shadow-sm dark:border-slate-700/70 dark:bg-slate-900/60">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Device Status</h3>
              <select
                id="deviceStatus"
                value={draft.system.deviceStatus}
                onChange={(e) => updateSystem('deviceStatus', e.target.value as AppSettings['system']['deviceStatus'])}
                className="w-full rounded-2xl border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700/50 dark:text-white"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-blue-200 dark:border-blue-900/50 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/10 p-4 shadow-sm">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              <span className="font-semibold">ℹ️ Note:</span> Thresholds, calibration offsets, and sampling changes are saved locally and synced to the backend when available.
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-sky-50 p-6 shadow-lg dark:border-slate-700/80 dark:from-slate-900 dark:via-slate-900 dark:to-sky-950/20">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-lg bg-slate-100 p-2 shadow-sm dark:bg-slate-800">
                <TimerReset className="h-5 w-5 text-slate-700 dark:text-slate-300" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900 dark:text-white">Live Summary</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">Current preferences at a glance</p>
              </div>
            </div>
            <div className="grid gap-2 text-sm text-slate-700 dark:text-slate-300 sm:grid-cols-2">
              {liveSummaryItems.map((item) => (
                <div key={item.label} className="rounded-xl border border-slate-200 bg-white/80 px-3 py-2 dark:border-slate-700 dark:bg-slate-900/70">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{item.label}</p>
                  <p className="mt-0.5 break-words font-semibold capitalize text-slate-900 dark:text-white">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-cyan-200 bg-gradient-to-br from-white via-cyan-50 to-sky-50 p-6 shadow-lg dark:border-cyan-900/40 dark:from-slate-900 dark:via-slate-900 dark:to-cyan-950/20">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-lg bg-cyan-100 p-2 shadow-sm dark:bg-cyan-900/40">
                <HelpCircle className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900 dark:text-white">Support</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">Help, support, and documentation</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="rounded-2xl bg-white/70 p-3 shadow-sm dark:bg-slate-900/60">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-800 dark:text-white">
                  <Mail className="h-4 w-4" />
                  Help Email
                </div>
                <a className="mt-1 block text-sm font-semibold text-sky-600 dark:text-sky-300" href={supportMailto}>
                  {supportEmail}
                </a>
              </div>
              <div className="rounded-2xl bg-white/70 p-3 shadow-sm dark:bg-slate-900/60">
                <p className="text-sm font-medium text-gray-800 dark:text-white">Help & Support</p>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                  Click the help email to send a support request with your account and device details pre-filled.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
