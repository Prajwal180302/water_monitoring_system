import {
  AlertTriangle,
  BarChart3,
  FileText,
  Home,
  Sparkles,
  Settings as SettingsIcon,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppSettings } from '../context/AppSettingsContext';
import { translate } from '../utils/translations';

const navItems = [
  {
    labelKey: 'home',
    path: '/dashboard',
    icon: Home,
    gradient: 'from-sky-500 via-cyan-500 to-blue-600',
    shadow: 'hover:shadow-sky-300/40',
    accent: 'border-sky-200/70 dark:border-sky-800/40',
    descriptionKey: 'liveDashboard',
  },
  {
    labelKey: 'alerts',
    path: '/alerts',
    icon: AlertTriangle,
    gradient: 'from-rose-500 via-pink-500 to-red-600',
    shadow: 'hover:shadow-rose-300/40',
    accent: 'border-rose-200/70 dark:border-rose-800/40',
    descriptionKey: 'criticalUpdates',
  },
  {
    labelKey: 'prediction',
    path: '/prediction',
    icon: BarChart3,
    gradient: 'from-emerald-500 via-teal-500 to-green-600',
    shadow: 'hover:shadow-emerald-300/40',
    accent: 'border-emerald-200/70 dark:border-emerald-800/40',
    descriptionKey: 'aiForecast',
  },
  {
    labelKey: 'reports',
    path: '/reports',
    icon: FileText,
    gradient: 'from-violet-500 via-purple-500 to-fuchsia-600',
    shadow: 'hover:shadow-violet-300/40',
    accent: 'border-violet-200/70 dark:border-violet-800/40',
    descriptionKey: 'analyticsView',
  },
  {
    labelKey: 'settings',
    path: '/settings',
    icon: SettingsIcon,
    gradient: 'from-slate-500 via-slate-600 to-slate-800',
    shadow: 'hover:shadow-slate-400/40',
    accent: 'border-slate-200/70 dark:border-slate-700/60',
    descriptionKey: 'systemControls',
  },
] as const;

export function PageNavigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const { settings } = useAppSettings();
  const t = (key: Parameters<typeof translate>[1]) => translate(settings.account.language, key);

  return (
    <div className="mb-8">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('quickNavigation')}</h3>
          <p className="text-sm text-slate-600 dark:text-slate-300">{t('quickNavigationSubtitle')}</p>
        </div>
        <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-white/85 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600 shadow-sm dark:border-slate-700/80 dark:bg-slate-900/70 dark:text-slate-300 md:inline-flex">
          <Sparkles className="h-3.5 w-3.5" />
          {t('smartNavigation')}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`group relative overflow-hidden rounded-3xl border bg-white/90 px-5 py-5 text-left shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.95),rgba(17,24,39,0.9))] dark:shadow-[0_18px_42px_rgba(2,6,23,0.45)] ${item.shadow} ${item.accent} ${
                isActive
                  ? 'ring-2 ring-sky-300/70 dark:ring-sky-700/50 dark:border-sky-700/50'
                  : ''
              }`}
            >
              <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${item.gradient}`} />
              <div className={`absolute -right-10 -top-10 h-24 w-24 rounded-full bg-gradient-to-br ${item.gradient} opacity-20 blur-2xl transition-all duration-300 group-hover:opacity-30 dark:opacity-25 dark:group-hover:opacity-40`} />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),transparent_32%)] opacity-60 dark:opacity-20" />

              <div className="relative flex min-h-[128px] flex-col justify-between">
                <div className="flex items-start justify-between gap-3">
                  <div className={`rounded-2xl bg-gradient-to-br ${item.gradient} p-3 text-white shadow-lg dark:shadow-[0_12px_24px_rgba(15,23,42,0.55)]`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  {isActive && (
                    <span className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-700 shadow-sm dark:border-sky-900/60 dark:bg-sky-950/40 dark:text-sky-300">
                      {t('active')}
                    </span>
                  )}
                </div>

                <div className="mt-6">
                  <span className="block text-lg font-bold tracking-tight text-slate-900 dark:text-white">{t(item.labelKey)}</span>
                  <span className="mt-1 block text-sm font-medium text-slate-500 dark:text-slate-400">{t(item.descriptionKey)}</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
