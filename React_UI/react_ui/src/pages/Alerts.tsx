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

  return (
    <Layout title="Alerts & Notifications" subtitle="Monitor and manage system alerts in real-time">
      {/* Stats */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-gray-200 bg-white dark:bg-gray-800 p-4 dark:border-gray-800 dark:bg-gray-900">
          <p className="text-sm text-gray-500 dark:text-gray-300">Total Alerts</p>
          <p className="mt-1 text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
          <p className="text-sm text-red-700 dark:text-red-400">Critical</p>
          <p className="mt-1 text-2xl font-bold text-red-600 dark:text-red-400">{stats.critical}</p>
        </div>
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-900 dark:bg-yellow-950">
          <p className="text-sm text-yellow-700 dark:text-yellow-400">Warnings</p>
          <p className="mt-1 text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.warning}</p>
        </div>
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950">
          <p className="text-sm text-blue-700 dark:text-blue-400">Info</p>
          <p className="mt-1 text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.info}</p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilterType('all')}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              filterType === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'
            }`}
          >
            <Filter className="mr-2 inline-block h-4 w-4" />
            All
          </button>
          <button
            onClick={() => setFilterType('critical')}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              filterType === 'critical'
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'
            }`}
          >
            Critical
          </button>
          <button
            onClick={() => setFilterType('warning')}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              filterType === 'warning'
                ? 'bg-yellow-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'
            }`}
          >
            Warning
          </button>
          <button
            onClick={() => setFilterType('info')}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              filterType === 'info'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'
            }`}
          >
            Info
          </button>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search alerts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800"
            />
          </div>
          <button
            onClick={exportAlerts}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>
      </div>

      {/* Alerts List */}
      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white dark:bg-gray-800 p-12 text-center dark:border-gray-800 dark:bg-gray-900">
            <CheckCircle className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-4 font-medium text-gray-600 dark:text-gray-400">No alerts found</p>
            <p className="text-sm text-gray-500 dark:text-gray-300">Try adjusting your filters</p>
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            const Icon = getAlertIcon(alert.type);
            return (
              <div
                key={alert.id}
                onClick={() => setSelectedAlert(alert)}
                className={`cursor-pointer rounded-lg border p-4 transition-all ${getAlertStyles(alert.type)}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <Icon className={`mt-0.5 h-5 w-5 flex-shrink-0 ${getAlertIconColor(alert.type)}`} />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 dark:text-white">{alert.message}</h3>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <span className="font-medium">{alert.location}</span>
                        <span>•</span>
                        <span>{alert.timestamp}</span>
                        <span>•</span>
                        <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium dark:bg-gray-700">
                          {alert.severity} Priority
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDismiss(alert.id);
                    }}
                    className="rounded-lg p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700"
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
            className="relative z-10 w-full max-w-2xl rounded-xl bg-white dark:bg-gray-800 p-6 shadow-2xl dark:bg-gray-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between">
              <button
                onClick={() => setSelectedAlert(null)}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 transition-colors font-medium"
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
                className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-300">Location</p>
                <p className="mt-1 text-gray-900 dark:text-white">{selectedAlert.location}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-300">Severity</p>
                <p className="mt-1">
                  <span className="rounded-full bg-gray-200 px-3 py-1 text-sm font-medium dark:bg-gray-700">
                    {selectedAlert.severity} Priority
                  </span>
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-300">Description</p>
                <p className="mt-1 text-gray-900 dark:text-white">{selectedAlert.description}</p>
              </div>

              <div className="flex gap-3 border-t border-gray-200 pt-4 dark:border-gray-700">
                <button
                  onClick={() => handleDismiss(selectedAlert.id)}
                  className="flex-1 rounded-lg bg-gray-100 px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"
                >
                  Dismiss
                </button>
                <button className="flex-1 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700">
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
