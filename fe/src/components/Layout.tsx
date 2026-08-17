import type { ReactNode } from 'react';
import { useAppSettings } from '../context/AppSettingsContext';
import { useTheme } from '../context/ThemeContext'; 
import { PageNavigation } from './PageNavigation';
import { translate } from '../utils/translations';

interface LayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  topBar?: ReactNode;
}

export function Layout({ children, title, subtitle, topBar }: LayoutProps) {
  const { darkMode } = useTheme(); 
  const { settings } = useAppSettings();
  const t = (key: Parameters<typeof translate>[1]) => translate(settings.account.language, key);

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        darkMode
          ? "bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.14),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(99,102,241,0.12),_transparent_25%),linear-gradient(135deg,_#020617_0%,_#0f172a_45%,_#111827_100%)] text-white"
          : "bg-gradient-to-br from-gray-50 via-white to-gray-100 text-black"
      }`}
    >
      <div className="p-6 lg:p-8">
        <div className="w-full">
          {topBar && <div className="mb-6">{topBar}</div>}

          {title && (
            <div className="relative mb-8 overflow-hidden rounded-3xl border border-sky-200/70 bg-gradient-to-br from-white via-sky-50 to-blue-100 px-6 py-6 shadow-lg dark:border-slate-700/80 dark:bg-[radial-gradient(circle_at_top_right,_rgba(56,189,248,0.14),_transparent_28%),radial-gradient(circle_at_bottom_left,_rgba(14,165,233,0.1),_transparent_26%),linear-gradient(135deg,_rgba(15,23,42,0.96)_0%,_rgba(15,23,42,0.92)_50%,_rgba(10,37,64,0.9)_100%)] dark:shadow-[0_18px_48px_rgba(2,6,23,0.55)]">
              <div className="pointer-events-none absolute -right-16 -top-16 hidden h-40 w-40 rounded-full bg-sky-300/25 blur-3xl dark:block" />
              <div className="pointer-events-none absolute -bottom-16 left-8 hidden h-36 w-36 rounded-full bg-blue-400/15 blur-3xl dark:block" />
              <div className="relative">
              <div className="mb-3 inline-flex items-center rounded-full border border-sky-200 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-sky-700 shadow-sm dark:border-sky-900/60 dark:bg-slate-900/75 dark:text-sky-300">
                {t('waterMonitoring')}
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white md:text-4xl">
                {title}
              </h1>
              {subtitle && (
                <p className="mt-3 max-w-4xl text-base font-medium leading-7 text-slate-700 dark:text-slate-200 md:text-lg">
                  {subtitle}
                </p>
              )}
              </div>
            </div>
          )}

          <PageNavigation />

          {children}
        </div>
      </div>
    </div>
  );
}
