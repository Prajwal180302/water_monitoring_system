import { useState, useEffect} from 'react';
import { AlertTriangle, CheckCircle, Info, XCircle, X, Filter, Search, Download, ArrowLeft } from 'lucide-react';
import { Layout } from '../components/Layout';
import axiosInstance from '../api/axiosInstance';

type Alert = {
  id: string;
  type: 'critical' | 'warning' | 'info' | 'success';
  message: string;
  location: string;
  timestamp: string;
};

export function Alerts() {
  const [alerts, setAlerts] = useState<(Alert & { description: string; severity: string })[]>([]);
  const [selectedAlert, setSelectedAlert] = useState<(Alert & { description: string; severity: string }) | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
  const fetchAlerts = async () => {
    try {
      const res = await axiosInstance.get("/alerts");
      const alertsData = res.data.alerts || [];

      if (!Array.isArray(alertsData)) {
        setAlerts([]);
        return;
      }
      
      const alertsWithDetails = alertsData.map((alert: Alert, index: number) => ({
        ...alert,
        id: alert.id || `alert-${index}`,
        description: alert.message,
        severity: alert.type
      }));

      setAlerts(alertsWithDetails);

    } catch (err) {
      console.error("ALERT API ERROR:", err);
      // Fallback: No alerts if API fails
      setAlerts([]);
    }
  };

  fetchAlerts();
  const interval = setInterval(fetchAlerts, 5000);

  return () => clearInterval(interval);
}, []);

  const getAlertIcon = (type: Alert['type']) => {
    switch (type) {
      case 'critical':
        return XCircle;
      case 'warning':
        return AlertTriangle;
      case 'success':
        return CheckCircle;
      default:
        return Info;
    }
  };

  const getAlertStyles = (type: Alert['type']) => {
    switch (type) {
      case 'critical':
        return 'bg-red-50 border-red-200 hover:border-red-300 dark:bg-red-950 dark:border-red-900';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 hover:border-yellow-300 dark:bg-yellow-950 dark:border-yellow-900';
      case 'success':
        return 'bg-green-50 border-green-200 hover:border-green-300 dark:bg-green-950 dark:border-green-900';
      default:
        return 'bg-blue-50 border-blue-200 hover:border-blue-300 dark:bg-blue-950 dark:border-blue-900';
    }
  };

  const getAlertIconColor = (type: Alert['type']) => {
    switch (type) {
      case 'critical':
        return 'text-red-600 dark:text-red-400';
      case 'warning':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'success':
        return 'text-green-600 dark:text-green-400';
      default:
        return 'text-blue-600 dark:text-blue-400';
    }
  };

  const filteredAlerts = alerts.filter((alert) => {
    const matchesType = filterType === 'all' || alert.type === filterType;
    const matchesSearch =
      alert.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const handleDismiss = (id: string) => {
    setAlerts(alerts.filter((alert) => alert.id !== id));
    if (selectedAlert?.id === id) {
      setSelectedAlert(null);
    }
  };

  const exportAlerts = () => {
    const csvContent = [
      ['Type', 'Message', 'Location', 'Timestamp', 'Severity', 'Description'],
      ...filteredAlerts.map((alert) => [
        alert.type,
        alert.message,
        alert.location,
        alert.timestamp,
        alert.severity,
        alert.description,
      ]),
    ]
      .map((row) => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `alerts-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const stats = {
    total: alerts.length,
    critical: alerts.filter((a) => a.type === 'critical').length,
    warning: alerts.filter((a) => a.type === 'warning').length,
    info: alerts.filter((a) => a.type === 'info' || a.type === 'success').length,
  };

  const statCards = [
    {
      label: 'Total Alerts',
      value: stats.total,
      tone: 'border-slate-200 bg-gradient-to-br from-white via-slate-50 to-sky-50 dark:border-slate-700/80 dark:from-slate-900 dark:via-slate-900 dark:to-sky-950/20',
      text: 'text-slate-900 dark:text-white',
      subtext: 'text-slate-500 dark:text-slate-400',
    },
    {
      label: 'Critical',
      value: stats.critical,
      tone: 'border-rose-200 bg-gradient-to-br from-rose-50 via-white to-red-50 dark:border-rose-900/50 dark:from-rose-950/30 dark:via-slate-900 dark:to-red-950/20',
      text: 'text-rose-600 dark:text-rose-400',
      subtext: 'text-rose-700 dark:text-rose-300',
    },
    {
      label: 'Warnings',
      value: stats.warning,
      tone: 'border-amber-200 bg-gradient-to-br from-amber-50 via-white to-yellow-50 dark:border-amber-900/50 dark:from-amber-950/30 dark:via-slate-900 dark:to-yellow-950/20',
      text: 'text-amber-600 dark:text-amber-400',
      subtext: 'text-amber-700 dark:text-amber-300',
    },
    {
      label: 'Info',
      value: stats.info,
      tone: 'border-sky-200 bg-gradient-to-br from-sky-50 via-white to-cyan-50 dark:border-sky-900/50 dark:from-sky-950/30 dark:via-slate-900 dark:to-cyan-950/20',
      text: 'text-sky-600 dark:text-sky-400',
      subtext: 'text-sky-700 dark:text-sky-300',
    },
  ];

  return (
    <Layout title="Smart Alert Center" subtitle="Real-time alert monitoring and management in one smart view">
      {/* Stats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <div key={card.label} className={`relative overflow-hidden rounded-3xl border p-5 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${card.tone}`}>
            <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-white/40 blur-2xl dark:bg-white/5" />
            <div className="relative">
              <p className={`text-xs font-semibold uppercase tracking-[0.2em] ${card.subtext}`}>{card.label}</p>
              <p className={`mt-3 text-3xl font-bold ${card.text}`}>{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters and Search */}
      <div className="mb-6 rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-sky-50 p-5 shadow-lg dark:border-slate-700/80 dark:from-slate-900 dark:via-slate-900 dark:to-sky-950/20">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Filter and explore live alerts</h3>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Use quick severity filters, search by location, and export the current view when needed.</p>
          </div>
        </div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilterType('all')}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              filterType === 'all'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                : 'bg-white text-slate-700 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
            }`}
          >
            <Filter className="mr-2 inline-block h-4 w-4" />
            All
          </button>
          <button
            onClick={() => setFilterType('critical')}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              filterType === 'critical'
                ? 'bg-rose-600 text-white'
                : 'bg-white text-slate-700 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
            }`}
          >
            Critical
          </button>
          <button
            onClick={() => setFilterType('warning')}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              filterType === 'warning'
                ? 'bg-amber-500 text-white'
                : 'bg-white text-slate-700 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
            }`}
          >
            Warning
          </button>
          <button
            onClick={() => setFilterType('info')}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              filterType === 'info'
                ? 'bg-sky-600 text-white'
                : 'bg-white text-slate-700 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
            }`}
          >
            Info
          </button>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search alerts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-2xl border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-slate-900 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>
          <button
            onClick={exportAlerts}
            className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-sky-600 to-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>
      </div>
      </div>

      {/* Alerts List */}
      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-emerald-50 p-12 text-center shadow-lg dark:border-slate-700/80 dark:from-slate-900 dark:via-slate-900 dark:to-emerald-950/20">
            <CheckCircle className="mx-auto h-12 w-12 text-emerald-500" />
            <p className="mt-4 font-semibold text-slate-700 dark:text-slate-200">No alerts found</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">Try adjusting your filters</p>
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            const Icon = getAlertIcon(alert.type);
            return (
              <div
                key={alert.id}
                onClick={() => setSelectedAlert(alert)}
                className={`cursor-pointer rounded-3xl border p-5 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${getAlertStyles(alert.type)}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <Icon className={`mt-0.5 h-5 w-5 flex-shrink-0 ${getAlertIconColor(alert.type)}`} />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 dark:text-white">{alert.message}</h3>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                        <span className="font-medium">{alert.location}</span>
                        <span>•</span>
                        <span>{alert.timestamp}</span>
                        <span>•</span>
                        <span className="rounded-full bg-white/80 px-2.5 py-1 text-xs font-medium shadow-sm dark:bg-slate-800/80">
                          {alert.severity} Priority
                        </span>
                      </div>
                      <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{alert.description}</p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDismiss(alert.id);
                    }}
                    className="rounded-xl p-2 transition-colors hover:bg-white/80 dark:hover:bg-slate-800/80"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Alert Detail Modal */}
      {selectedAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setSelectedAlert(null)}>
          <div className="fixed inset-0 bg-black/50" />
          <div
            className="relative z-10 w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700/80 dark:bg-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-sky-50 via-white to-rose-50 p-6 dark:from-slate-900 dark:via-slate-900 dark:to-rose-950/20">
            <div className="mb-4 flex items-start justify-between">
              <button
                onClick={() => setSelectedAlert(null)}
                className="flex items-center gap-2 rounded-xl px-3 py-2 font-medium text-gray-600 transition-colors hover:bg-white/80 dark:text-gray-400 dark:hover:bg-slate-800"
              >
                <ArrowLeft className="h-5 w-5" />
                Back
              </button>
              <div className="flex-1 flex items-start gap-3">
                {(() => {
                  const Icon = getAlertIcon(selectedAlert.type);
                  return <Icon className={`mt-1 h-6 w-6 ${getAlertIconColor(selectedAlert.type)}`} />;
                })()}
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">{selectedAlert.message}</h2>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-300">{selectedAlert.timestamp}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedAlert(null)}
                className="rounded-xl p-2 hover:bg-white/80 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            </div>

            <div className="space-y-4 p-6">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/70">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-300">Location</p>
                <p className="mt-1 text-gray-900 dark:text-white">{selectedAlert.location}</p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/70">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-300">Severity</p>
                <p className="mt-1">
                  <span className="rounded-full bg-white px-3 py-1 text-sm font-medium shadow-sm dark:bg-slate-700">
                    {selectedAlert.severity} Priority
                  </span>
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/70">
                <p className="text-sm font-medium text-gray-500 dark:text-gray-300">Description</p>
                <p className="mt-1 text-gray-900 dark:text-white">{selectedAlert.description}</p>
              </div>

              <div className="flex gap-3 border-t border-slate-200 pt-4 dark:border-slate-700">
                <button
                  onClick={() => handleDismiss(selectedAlert.id)}
                  className="flex-1 rounded-2xl bg-slate-100 px-4 py-2.5 font-medium text-slate-700 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                >
                  Dismiss
                </button>
                <button className="flex-1 rounded-2xl bg-gradient-to-r from-sky-600 to-blue-600 px-4 py-2.5 font-medium text-white shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg">
                  Take Action
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
