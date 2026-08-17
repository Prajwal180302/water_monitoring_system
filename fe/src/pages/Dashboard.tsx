import { useState, useEffect, useMemo } from 'react';
import { Activity, ArrowDownRight, ArrowUpRight, CheckCircle, AlertTriangle, Clock, Droplet, Gauge, Minus, RefreshCw, Thermometer, Wind } from 'lucide-react';
import axiosInstance from '../api/axiosInstance';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Layout } from '../components/Layout';
import { useAppSettings } from '../context/AppSettingsContext';
import { celsiusToFahrenheit, formatSamplingInterval } from '../utils/appSettings';

interface WaterData {
  time: string;
  fullTime?: string;
  chartTime?: string;
  pH: number;
  tds: number;
  temperature: number;
  turbidity: number;
  conductivity: number;
}

const formatMetricValue = (value: number, digits = 2) => value.toFixed(digits);

function Dashboard() {
  const { settings } = useAppSettings();
  const thresholds = settings.system.thresholds;

  const [metrics, setMetrics] = useState({
    ph: null as number | null,
    tds: null as number | null,
    temperature: null as number | null,
    turbidity: null as number | null,
    conductivity: null as number | null,
  });

  const [currentTime, setCurrentTime] = useState(new Date());

  const [waterData, setWaterData] = useState<WaterData[]>([]);
  const [dataError, setDataError] = useState('');
  const [selectedParams, setSelectedParams] = useState([
    "pH",
    "tds",
    "temperature",
    "turbidity",
    "conductivity",
  ]);
  const [selectedFilter, setSelectedFilter] = useState('all');

  const parameters = [
    { key: "pH", label: "pH", color: "#8b5cf6" },
    { key: "tds", label: "TDS", color: "#3b82f6" },
    { key: "temperature", label: "Temp", color: "#f97316" },
    { key: "turbidity", label: "Turbidity", color: "#06b6d4" },
    { key: "conductivity", label: "Cond", color: "#10b981" },
  ];

  const handleParameterFilterChange = (value: string) => {
    setSelectedFilter(value);

    if (value === 'all') {
      setSelectedParams(parameters.map((param) => param.key));
      return;
    }

    setSelectedParams([value]);
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axiosInstance.get("/data");

        const formattedData = res.data.map((item: any) => ({
          ...item,
          time: new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          fullTime: new Date(item.timestamp).toLocaleString(),
        }));

        setWaterData(formattedData);
        setDataError('');
        const latest = res.data[res.data.length - 1];

        if (latest) {
          setMetrics({
            ph: latest.pH,
            tds: latest.tds,
            temperature: latest.temperature,
            turbidity: latest.turbidity,
            conductivity: latest.conductivity,
          });
        }

      } catch (err) {
        console.error("API ERROR:", err);
        setDataError('Live sensor feed is offline. Displayed values may be outdated until the connection returns.');
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 3000);

    return () => clearInterval(interval);
  }, []);

  const isWaterSafe =
    metrics.ph !== null &&
    metrics.tds !== null &&
    metrics.turbidity !== null &&
    metrics.temperature !== null &&
    metrics.conductivity !== null &&
    metrics.ph >= thresholds.pH_min &&
    metrics.ph <= thresholds.pH_max &&
    metrics.tds <= thresholds.tds &&
    metrics.turbidity <= thresholds.turbidity &&
    metrics.temperature >= thresholds.temperature_min &&
    metrics.temperature <= thresholds.temperature_max &&
    metrics.conductivity <= thresholds.conductivity;

  const latestReading = waterData[waterData.length - 1];
  const previousReading = waterData[waterData.length - 2];
  const showLiveTime = settings.preferences.liveTimeEnabled;
  const useFahrenheit = settings.preferences.temperatureUnit === 'F';

  const formatDashboardValue = (value: number | null, key: string) => {
    if (value === null) {
      return '--';
    }

    if (key === 'temperature') {
      const displayValue = useFahrenheit ? celsiusToFahrenheit(value) : value;
      return displayValue.toFixed(2);
    }

    return value.toFixed(2);
  };

  const metricCards = [
    {
      key: "pH",
      label: "pH",
      metricValue: metrics.ph,
      previousValue: previousReading?.pH,
      icon: Activity,
      iconClass: "text-violet-600 dark:text-violet-400",
      panelClass: "from-violet-50 via-white to-fuchsia-50 dark:from-violet-950/35 dark:via-slate-900 dark:to-fuchsia-950/25",
      borderClass: "border-violet-200 dark:border-violet-900/60",
      badgeClass: "bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300",
      unit: "",
      safe: metrics.ph !== null && metrics.ph >= thresholds.pH_min && metrics.ph <= thresholds.pH_max,
      guidance: `Ideal range ${thresholds.pH_min} - ${thresholds.pH_max}`,
    },
    {
      key: "tds",
      label: "TDS",
      metricValue: metrics.tds,
      previousValue: previousReading?.tds,
      icon: Droplet,
      iconClass: "text-blue-600 dark:text-blue-400",
      panelClass: "from-blue-50 via-white to-cyan-50 dark:from-blue-950/35 dark:via-slate-900 dark:to-cyan-950/25",
      borderClass: "border-blue-200 dark:border-blue-900/60",
      badgeClass: "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300",
      unit: "ppm",
      safe: metrics.tds !== null && metrics.tds <= thresholds.tds,
      guidance: `Target below ${thresholds.tds} ppm`,
    },
    {
      key: "temperature",
      label: "Temperature",
      metricValue: metrics.temperature,
      previousValue: previousReading?.temperature,
      icon: Thermometer,
      iconClass: "text-orange-600 dark:text-orange-400",
      panelClass: "from-orange-50 via-white to-amber-50 dark:from-orange-950/35 dark:via-slate-900 dark:to-amber-950/25",
      borderClass: "border-orange-200 dark:border-orange-900/60",
      badgeClass: "bg-orange-100 text-orange-700 dark:bg-orange-950/50 dark:text-orange-300",
      unit: useFahrenheit ? "°F" : "°C",
      safe: metrics.temperature !== null && metrics.temperature >= thresholds.temperature_min && metrics.temperature <= thresholds.temperature_max,
      guidance: `Stable band ${thresholds.temperature_min} - ${thresholds.temperature_max} °C`,
    },
    {
      key: "turbidity",
      label: "Turbidity",
      metricValue: metrics.turbidity,
      previousValue: previousReading?.turbidity,
      icon: Wind,
      iconClass: "text-cyan-600 dark:text-cyan-400",
      panelClass: "from-cyan-50 via-white to-sky-50 dark:from-cyan-950/35 dark:via-slate-900 dark:to-sky-950/25",
      borderClass: "border-cyan-200 dark:border-cyan-900/60",
      badgeClass: "bg-cyan-100 text-cyan-700 dark:bg-cyan-950/50 dark:text-cyan-300",
      unit: "NTU",
      safe: metrics.turbidity !== null && metrics.turbidity <= thresholds.turbidity,
      guidance: `Keep under ${thresholds.turbidity} NTU`,
    },
    {
      key: "conductivity",
      label: "Conductivity",
      metricValue: metrics.conductivity,
      previousValue: previousReading?.conductivity,
      icon: Gauge,
      iconClass: "text-emerald-600 dark:text-emerald-400",
      panelClass: "from-emerald-50 via-white to-lime-50 dark:from-emerald-950/35 dark:via-slate-900 dark:to-lime-950/25",
      borderClass: "border-emerald-200 dark:border-emerald-900/60",
      badgeClass: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300",
      unit: "uS/cm",
      safe: metrics.conductivity !== null && metrics.conductivity <= thresholds.conductivity,
      guidance: `Preferred below ${thresholds.conductivity} uS/cm`,
    },
  ].map((metric) => {
    const delta = typeof metric.previousValue === "number" && typeof metric.metricValue === "number"
      ? metric.metricValue - metric.previousValue
      : 0;

    return {
      ...metric,
      delta,
      priorityScore: (metric.safe ? 0 : 10000) + Math.abs(delta),
    };
  }).sort((a, b) => b.priorityScore - a.priorityScore);

  const liveAlerts = metricCards.filter((metric) => !metric.safe).length;
  const leadMetric = metricCards[0];
  const lastSampleLabel = latestReading?.time || currentTime.toLocaleTimeString();
  const chartData = useMemo(() => {
    if (!waterData.length) {
      return [];
    }

    const labelStep = Math.max(1, Math.ceil(waterData.length / 6));

    return waterData.map((item, index) => ({
      ...item,
      chartTime: index % labelStep === 0 || index === waterData.length - 1 ? item.time : '',
      fullTime: item.fullTime || item.time,
    }));
  }, [waterData]);

  return (
    <Layout
      title="Smart Water Quality Monitoring System"
      subtitle="Track live sensor readings, monitor water safety, and review critical quality parameters from one unified control center."
      topBar={
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-gradient-to-r from-white via-slate-50 to-sky-50 p-4 shadow-lg backdrop-blur-sm dark:border-slate-700/80 dark:bg-[linear-gradient(135deg,rgba(15,23,42,0.96),rgba(15,23,42,0.88),rgba(8,47,73,0.72))] dark:shadow-[0_18px_42px_rgba(2,6,23,0.5)]">
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white/85 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-sky-700 shadow-sm dark:border-slate-700/80 dark:bg-slate-900/85 dark:text-sky-300">
            <RefreshCw className="h-3.5 w-3.5" />
            Real-Time Monitoring
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {showLiveTime && (
              <div className="flex items-center gap-2 rounded-2xl border border-sky-200 bg-white/85 px-4 py-2.5 shadow-sm backdrop-blur-sm dark:border-slate-700/80 dark:bg-slate-900/80">
                <Clock className="h-4 w-4 text-gray-600 dark:text-slate-300" />
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  {currentTime.toLocaleTimeString()}
                </span>
              </div>
            )}
            <div className="rounded-2xl border border-emerald-200 bg-white/85 px-4 py-2.5 text-sm font-medium text-emerald-700 shadow-sm dark:border-emerald-900/60 dark:bg-slate-900/80 dark:text-emerald-300">
              Sampling every {formatSamplingInterval(settings.system.samplingInterval)}
            </div>
          </div>
        </div>
      }
    >
      <div className="mb-8 grid gap-4 lg:grid-cols-[1.4fr_0.8fr_0.8fr]">
        <div className="relative overflow-hidden rounded-3xl border border-sky-200/70 bg-gradient-to-br from-sky-100 via-white to-emerald-100 p-6 shadow-lg dark:border-slate-700/80 dark:bg-[radial-gradient(circle_at_top_right,_rgba(34,211,238,0.12),_transparent_24%),linear-gradient(145deg,rgba(15,23,42,0.96),rgba(15,23,42,0.92),rgba(6,78,59,0.6))] dark:shadow-[0_18px_44px_rgba(2,6,23,0.52)]">
          <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-sky-300/30 blur-2xl dark:bg-sky-600/20" />
          <div className="absolute -bottom-10 left-10 h-24 w-24 rounded-full bg-emerald-300/30 blur-2xl dark:bg-emerald-600/20" />
          <div className="relative">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white/85 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-sky-700 shadow-sm dark:border-slate-700 dark:bg-slate-900/80 dark:text-sky-300">
              <RefreshCw className="h-3.5 w-3.5" />
              Live priority view
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Cards reposition automatically from the newest sensor data</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
              Unsafe or fast-changing metrics rise to the top first, so the most important readings stay in focus as data refreshes every 30 mins.
            </p>
          </div>
        </div>

        <div className="rounded-3xl border border-rose-200 bg-gradient-to-br from-rose-50 to-white p-5 shadow-md dark:border-rose-900/50 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.95),rgba(15,23,42,0.88),rgba(127,29,29,0.34))] dark:shadow-[0_16px_36px_rgba(2,6,23,0.46)]">
          <p className="text-xs font-semibold uppercase tracking-wide text-rose-700 dark:text-rose-300">Live Alerts</p>
          <p className="mt-2 text-3xl font-bold text-rose-600 dark:text-rose-400">{liveAlerts}</p>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            {liveAlerts === 0 ? 'All tracked metrics are inside the target range.' : 'Readings outside target are moved to the front.'}
          </p>
        </div>

        <div className="rounded-3xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-5 shadow-md dark:border-amber-900/50 dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.95),rgba(15,23,42,0.88),rgba(120,53,15,0.34))] dark:shadow-[0_16px_36px_rgba(2,6,23,0.46)]">
          <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">Top Priority</p>
          <p className="mt-2 text-3xl font-bold text-amber-600 dark:text-amber-400">{leadMetric?.label || 'N/A'}</p>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Updated from the latest sample at {lastSampleLabel}.
          </p>
        </div>
      </div>

      {/* WATER STATUS */}
      <div className="mb-8 mt-12" style={{ marginTop: '3rem' }}>
          <div className={`group rounded-2xl border-2 p-8 shadow-md transition-all duration-300 shadow-lg hover:shadow-2xl hover:scale-[1.02] ${
          isWaterSafe
            ? 'border-green-400 bg-green-100 dark:bg-green-900/30'
            : 'border-red-400 bg-red-100 dark:bg-red-900/30'
        }`}>
          <div className="flex items-center gap-4">
            {isWaterSafe ? (
              <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" />
            ) : (
              <AlertTriangle className="h-12 w-12 text-red-600 dark:text-red-400" />
            )}
            <div>
              <h2 className="text-xl font-bold text-black dark:text-white">
                Water Status: {metrics.ph === null ? 'NO LIVE DATA' : isWaterSafe ? 'SAFE' : 'UNSAFE'}
              </h2>
              <p className={`text-sm font-bold ${
                isWaterSafe
                  ? 'text-green-900 dark:text-green-100'
                  : 'text-red-900 dark:text-red-100'
              }`}>
                {metrics.ph === null ? 'Sensor feed is unavailable right now.' : isWaterSafe ? 'All parameters normal' : 'Check water quality immediately!'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {dataError && (
        <div className="mb-6 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800 shadow-sm dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
          {dataError}
        </div>
      )}

      {/* METRICS CARDS */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {metricCards.map((metric, index) => {
          const Icon = metric.icon;
          const TrendIcon = metric.delta > 0 ? ArrowUpRight : metric.delta < 0 ? ArrowDownRight : Minus;
          const trendTone = metric.delta > 0
            ? 'text-emerald-600 dark:text-emerald-400'
            : metric.delta < 0
              ? 'text-rose-600 dark:text-rose-400'
              : 'text-slate-500 dark:text-slate-400';

          return (
            <div
              key={metric.key}
              className={`group relative overflow-hidden rounded-3xl border bg-gradient-to-br ${metric.panelClass} ${metric.borderClass} p-5 shadow-lg transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl ${
                index === 0 ? 'ring-2 ring-amber-300/70 dark:ring-amber-700/50' : ''
              } ${!metric.safe ? 'animate-pulse' : ''}`}
            >
              <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-white/50 blur-2xl dark:bg-white/5" />
              <div className="relative flex h-full flex-col justify-between">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${metric.badgeClass}`}>
                      {metrics.ph === null ? 'Waiting' : index === 0 ? 'Top priority' : metric.safe ? 'Stable' : 'Attention'}
                    </div>
                    <p className="mt-4 text-sm font-medium text-slate-500 dark:text-slate-400">{metric.label}</p>
                    <h3 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
                      {formatDashboardValue(metric.metricValue, metric.key)}
                      <span className="ml-1 text-sm font-medium text-slate-500 dark:text-slate-400">{metric.unit}</span>
                    </h3>
                  </div>

                  <div className={`rounded-2xl bg-white/80 p-3 shadow-sm dark:bg-slate-900/70 ${metric.iconClass}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  <div className="flex items-center justify-between rounded-2xl border border-white/60 bg-white/70 px-4 py-3 text-sm dark:border-slate-700/70 dark:bg-slate-900/70">
                    <span className="text-slate-500 dark:text-slate-400">Live movement</span>
                    <span className={`inline-flex items-center gap-1 font-semibold ${trendTone}`}>
                      <TrendIcon className="h-4 w-4" />
                      {typeof metric.previousValue === "number"
                        ? `${metric.delta >= 0 ? '+' : ''}${formatMetricValue(metric.delta)}`
                        : 'No previous sample'}
                    </span>
                  </div>

                  <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                    {metric.guidance}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* CHART */}
      <div className="bg-white dark:bg-[linear-gradient(145deg,rgba(15,23,42,0.97),rgba(15,23,42,0.9),rgba(30,41,59,0.82))] 
      backdrop-blur-md border border-gray-200 dark:border-slate-700/80 
      rounded-2xl shadow-lg p-6 mt-6">
        <h2 className="text-lg font-semibold mb-4 text-black dark:text-white">
          Water Quality Trends
        </h2>

        <div className="mb-4 rounded-2xl bg-gray-100 p-4 shadow-sm dark:bg-slate-950/55 dark:ring-1 dark:ring-slate-800/80">

  <div className="flex justify-between items-center mb-3">
    <h3 className="font-semibold text-gray-700 dark:text-gray-200">
      Filter Parameters
    </h3>

    <div className="min-w-[220px]">
      <select
        value={selectedFilter}
        onChange={(e) => handleParameterFilterChange(e.target.value)}
        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-gray-200"
      >
        <option value="all">All Parameters</option>
        {parameters.map((param) => (
          <option key={param.key} value={param.key}>
            {param.label}
          </option>
        ))}
      </select>
    </div>
  </div>

  <p className="text-xs text-gray-500 dark:text-gray-400">
    {selectedFilter === 'all' ? 'Showing all water quality parameters.' : `Showing ${parameters.find((param) => param.key === selectedFilter)?.label || 'selected'} only.`}
  </p>
</div>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 30 }}>
              <XAxis
                dataKey="chartTime"
                minTickGap={28}
                tick={{ fontSize: 12, fill: '#6b7280' }}
                tickMargin={10}
                label={{ value: 'Sample time', position: 'insideBottom', offset: -10 }}
              />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip labelFormatter={(_label, payload) => payload?.[0]?.payload?.fullTime || 'Sample time'} />
              {parameters.map((param) =>
                selectedParams.includes(param.key) ? (
                  <Line
                    key={param.key}
                    type="monotone"
                    dataKey={param.key}
                    stroke={param.color}
                    strokeWidth={3}
                    dot={false}
                  />
                ) : null
              )}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-[300px] items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-center text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-300">
            <div>
              <p className="font-semibold">No live chart data available</p>
              <p className="mt-1">Check device connectivity and sensor feed, then refresh.</p>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default Dashboard;
