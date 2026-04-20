export type LanguageOption = 'en' | 'hi' | 'mr';
export type TemperatureUnit = 'C' | 'F';
export type LayoutOption = 'comfortable' | 'compact';
export type DeviceStatus = 'active' | 'inactive';
export type SyncMode = 'wifi' | 'cloud' | 'hybrid';

export interface Thresholds {
  pH_min: number;
  pH_max: number;
  tds: number;
  turbidity: number;
  temperature_min: number;
  temperature_max: number;
  conductivity: number;
}

export interface CalibrationSettings {
  ph: number;
  tds: number;
  turbidity: number;
  conductivity: number;
}

export interface AccountSettings {
  name: string;
  email: string;
  language: LanguageOption;
  phone: string;
}

export interface PreferenceSettings {
  notificationsEnabled: boolean;
  darkModeEnabled: boolean;
  liveTimeEnabled: boolean;
  temperatureUnit: TemperatureUnit;
  tdsUnit: 'ppm';
  turbidityUnit: 'NTU';
  layout: LayoutOption;
}

export interface SystemConfigurationSettings {
  thresholds: Thresholds;
  calibration: CalibrationSettings;
  samplingInterval: number;
  deviceStatus: DeviceStatus;
}

export interface ConnectivitySettings {
  wifiName: string;
  syncMode: SyncMode;
  cloudSyncEnabled: boolean;
  deviceId: string;
  firmwareVersion: string;
  lastSync: string;
}

export interface SupportSettings {
  helpEmail: string;
}

export interface AppSettings {
  account: AccountSettings;
  preferences: PreferenceSettings;
  system: SystemConfigurationSettings;
  connectivity: ConnectivitySettings;
  support: SupportSettings;
}

export const APP_SETTINGS_STORAGE_KEY = 'water-monitoring-settings';
export const USER_PROFILE_STORAGE_KEY = 'water-monitoring-user-profile';
export const THEME_STORAGE_KEY = 'theme';
export const LANGUAGE_STORAGE_KEY = 'water-monitoring-language';
export const DEFAULT_SAMPLING_INTERVAL_SECONDS = 30 * 60;

export const saveSetting = <T>(key: string, value: T) => {
  localStorage.setItem(key, JSON.stringify(value));
};

export const getSetting = <T>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch (error) {
    console.error(`Failed to read setting "${key}":`, error);
    return fallback;
  }
};

const createDeviceId = () => `WM-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;

export const createDefaultAppSettings = (): AppSettings => ({
  account: {
    name: 'Water Operator',
    email: 'operator@example.com',
    language: 'en',
    phone: '',
  },
  preferences: {
    notificationsEnabled: true,
    darkModeEnabled: false,
    liveTimeEnabled: true,
    temperatureUnit: 'C',
    tdsUnit: 'ppm',
    turbidityUnit: 'NTU',
    layout: 'comfortable',
  },
  system: {
    thresholds: {
      pH_min: 6.5,
      pH_max: 8.5,
      tds: 500,
      turbidity: 1,
      temperature_min: 10,
      temperature_max: 25,
      conductivity: 1000,
    },
    calibration: {
      ph: 0,
      tds: 0,
      turbidity: 0,
      conductivity: 0,
    },
    samplingInterval: DEFAULT_SAMPLING_INTERVAL_SECONDS,
    deviceStatus: 'active',
  },
  connectivity: {
    wifiName: 'WaterMonitor-Net',
    syncMode: 'hybrid',
    cloudSyncEnabled: true,
    deviceId: createDeviceId(),
    firmwareVersion: 'v1.4.2',
    lastSync: new Date().toLocaleString(),
  },
  support: {
    helpEmail: 'prajwalshingote180302@gmail.com',
  },
});

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const mergeObjects = <T extends Record<string, unknown>>(base: T, incoming?: Partial<T>): T => {
  if (!incoming) return base;

  const result: Record<string, unknown> = { ...base };

  Object.entries(incoming).forEach(([key, value]) => {
    const baseValue = result[key];

    if (isObject(baseValue) && isObject(value)) {
      result[key] = mergeObjects(baseValue, value);
      return;
    }

    if (value !== undefined) {
      result[key] = value;
    }
  });

  return result as T;
};

export const mergeAppSettings = (incoming?: Partial<AppSettings>): AppSettings =>
  mergeObjects(createDefaultAppSettings() as unknown as Record<string, unknown>, incoming as unknown as Partial<Record<string, unknown>>) as unknown as AppSettings;

export const loadAppSettings = (): AppSettings => {
  try {
    return mergeAppSettings(getSetting<Partial<AppSettings>>(APP_SETTINGS_STORAGE_KEY, createDefaultAppSettings()));
  } catch (error) {
    console.error('Failed to load app settings:', error);
    return createDefaultAppSettings();
  }
};

export const saveAppSettings = (settings: AppSettings) => {
  saveSetting(APP_SETTINGS_STORAGE_KEY, settings);
  saveSetting(USER_PROFILE_STORAGE_KEY, settings.account);
  saveSetting(LANGUAGE_STORAGE_KEY, settings.account.language);
  localStorage.setItem(THEME_STORAGE_KEY, settings.preferences.darkModeEnabled ? 'dark' : 'light');
};

export const celsiusToFahrenheit = (value: number) => (value * 9) / 5 + 32;

export const formatSamplingInterval = (seconds: number) => {
  if (seconds >= 60 && seconds % 60 === 0) {
    const minutes = seconds / 60;
    return `${minutes} min`;
  }

  return `${seconds}s`;
};
