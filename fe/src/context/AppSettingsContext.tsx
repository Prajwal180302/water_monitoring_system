import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { loadAppSettings, mergeAppSettings, saveAppSettings } from '../utils/appSettings';
import type { AppSettings } from '../utils/appSettings';

interface AppSettingsContextType {
  settings: AppSettings;
  updateSettings: (updates: Partial<AppSettings>) => void;
  replaceSettings: (nextSettings: AppSettings) => void;
  resetSettings: () => void;
}

const AppSettingsContext = createContext<AppSettingsContextType | undefined>(undefined);

export function AppSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(() => loadAppSettings());

  useEffect(() => {
    saveAppSettings(settings);
  }, [settings]);

  const value = useMemo<AppSettingsContextType>(
    () => ({
      settings,
      updateSettings: (updates) => {
        setSettings((current) => mergeAppSettings({ ...current, ...updates }));
      },
      replaceSettings: (nextSettings) => {
        setSettings(mergeAppSettings(nextSettings));
      },
      resetSettings: () => {
        setSettings(loadAppSettings());
      },
    }),
    [settings]
  );

  return <AppSettingsContext.Provider value={value}>{children}</AppSettingsContext.Provider>;
}

export function useAppSettings() {
  const context = useContext(AppSettingsContext);
  if (!context) {
    throw new Error('useAppSettings must be used within AppSettingsProvider');
  }

  return context;
}
