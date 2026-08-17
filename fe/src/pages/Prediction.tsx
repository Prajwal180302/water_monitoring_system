import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Droplets,
  Gauge,
  RefreshCw,
  Thermometer,
  TrendingDown,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import axiosInstance from '../api/axiosInstance';
import { Layout } from '../components/Layout';

type ReadingValues = {
  pH?: number;
  tds?: number;
  turbidity?: number;
  temperature?: number;
  conductivity?: number;
};

type PredictionState = {
  actual: ReadingValues;
  predicted: ReadingValues;
  maintenance: string;
  statusText: string;
  lastUpdated: string;
};

type MetricKey = keyof ReadingValues;

const PREDICTION_REFRESH_INTERVAL_MS = 30 * 60 * 1000;
const PREDICTION_REFRESH_LABEL = 'Forecast updates every 30 minutes';

const metricConfig = [
  { key: 'pH', label: 'pH', unit: '', icon: Activity, color: 'text-violet-600 dark:text-violet-400', bg: 'from-violet-50 to-fuchsia-50 dark:from-violet-950/40 dark:to-fuchsia-950/40', border: 'border-violet-200 dark:border-violet-900/50' },
  { key: 'tds', label: 'TDS', unit: 'ppm', icon: Gauge, color: 'text-blue-600 dark:text-blue-400', bg: 'from-blue-50 to-cyan-50 dark:from-blue-950/40 dark:to-cyan-950/40', border: 'border-blue-200 dark:border-blue-900/50' },
  { key: 'turbidity', label: 'Turbidity', unit: 'NTU', icon: Droplets, color: 'text-cyan-600 dark:text-cyan-400', bg: 'from-cyan-50 to-sky-50 dark:from-cyan-950/40 dark:to-sky-950/40', border: 'border-cyan-200 dark:border-cyan-900/50' },
  { key: 'temperature', label: 'Temperature', unit: '°C', icon: Thermometer, color: 'text-orange-600 dark:text-orange-400', bg: 'from-orange-50 to-amber-50 dark:from-orange-950/40 dark:to-amber-950/40', border: 'border-orange-200 dark:border-orange-900/50' },
  { key: 'conductivity', label: 'Conductivity', unit: 'uS/cm', icon: Zap, color: 'text-emerald-600 dark:text-emerald-400', bg: 'from-emerald-50 to-lime-50 dark:from-emerald-950/40 dark:to-lime-950/40', border: 'border-emerald-200 dark:border-emerald-900/50' },
] as const;

const toNumber = (value: unknown): number | undefined => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const formatValue = (value?: number, unit = '') => {
  if (typeof value !== 'number') return 'N/A';
  const digits = unit === '' || unit === '°C' ? 2 : 2;
  return `${value.toFixed(digits)}${unit ? ` ${unit}` : ''}`;
};

const getPredictedValue = (source: any, key: keyof ReadingValues) => {
  const mapping: Record<keyof ReadingValues, string[]> = {
    pH: ['pH', 'ph', 'PH'],
    tds: ['tds', 'TDS'],
    turbidity: ['turbidity', 'Turbidity'],
    temperature: ['temperature', 'Temperature'],
    conductivity: ['conductivity', 'Conductivity'],
  };

  for (const candidate of mapping[key]) {
    const value = toNumber(source?.[candidate]);
    if (typeof value === 'number') {
      return value;
    }
  }

  return undefined;
};

const getTrendLabel = (actual?: number, predicted?: number) => {
  if (typeof actual !== 'number' || typeof predicted !== 'number') {
    return { text: 'Waiting for data', icon: TrendingUp, tone: 'text-gray-500 dark:text-gray-400' };
  }

  if (predicted > actual) {
    return { text: 'Increasing', icon: TrendingUp, tone: 'text-emerald-600 dark:text-emerald-400' };
  }

  if (predicted < actual) {
    return { text: 'Decreasing', icon: TrendingDown, tone: 'text-rose-600 dark:text-rose-400' };
  }

  return { text: 'Stable', icon: CheckCircle, tone: 'text-blue-600 dark:text-blue-400' };
};

const getMetricStatus = (key: MetricKey, value?: number) => {
  if (typeof value !== 'number') return 'unknown';

  switch (key) {
    case 'pH':
      return value >= 6.5 && value <= 8.5 ? 'safe' : 'alert';
    case 'tds':
      return value <= 500 ? 'safe' : 'alert';
    case 'turbidity':
      return value <= 1 ? 'safe' : 'alert';
    case 'temperature':
      return value >= 10 && value <= 25 ? 'safe' : 'alert';
    case 'conductivity':
      return value <= 1000 ? 'safe' : 'alert';
    default:
      return 'unknown';
  }
};

const getComparisonWidth = (actual?: number, predicted?: number) => {
  const values = [actual, predicted].filter((value): value is number => typeof value === 'number');
  const maxValue = Math.max(...values, 1);

  return {
    actual: typeof actual === 'number' ? Math.max((actual / maxValue) * 100, 8) : 8,
    predicted: typeof predicted === 'number' ? Math.max((predicted / maxValue) * 100, 8) : 8,
  };
};

export function Prediction() {
  const [prediction, setPrediction] = useState<PredictionState>({
    actual: {},
    predicted: {},
    maintenance: 'Loading...',
    statusText: 'Fetching latest prediction...',
    lastUpdated: '',
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPrediction = async () => {
      try {
        const [dataRes, predRes] = await Promise.all([
          axiosInstance.get('/data'),
          axiosInstance.get('/predict'),
        ]);

        const records = Array.isArray(dataRes.data) ? dataRes.data : [];
        const predictionPayload = predRes.data?.prediction_for_next_reading || {};
        const lastActual = records.length > 0 ? records[records.length - 1] : {};

        const actual: ReadingValues = {
          pH: toNumber(lastActual?.pH),
          tds: toNumber(lastActual?.tds),
          turbidity: toNumber(lastActual?.turbidity),
          temperature: toNumber(lastActual?.temperature),
          conductivity: toNumber(lastActual?.conductivity),
        };

        const predicted: ReadingValues = {
          pH: getPredictedValue(predictionPayload, 'pH'),
          tds: getPredictedValue(predictionPayload, 'tds'),
          turbidity: getPredictedValue(predictionPayload, 'turbidity'),
          temperature: getPredictedValue(predictionPayload, 'temperature'),
          conductivity: getPredictedValue(predictionPayload, 'conductivity'),
        };

        let maintenance = 'Normal';
        if (
          (typeof predicted.tds === 'number' && predicted.tds > 500) ||
          (typeof predicted.turbidity === 'number' && predicted.turbidity > 1.0) ||
          (typeof predicted.conductivity === 'number' && predicted.conductivity > 1000)
        ) {
          maintenance = 'Required Soon';
        }

        const phTrend = getTrendLabel(actual.pH, predicted.pH).text;
        const turbidityTrend = getTrendLabel(actual.turbidity, predicted.turbidity).text;
        const statusText = `Next reading suggests pH is ${phTrend.toLowerCase()} and turbidity is ${turbidityTrend.toLowerCase()}.`;

        setPrediction({
          actual,
          predicted,
          maintenance,
          statusText,
          lastUpdated: new Date().toLocaleString(),
        });
      } catch (err) {
        console.error('PREDICTION ERROR:', err);
        setPrediction((current) => ({
          ...current,
          maintenance: 'Unavailable',
          statusText: 'Prediction service is not responding right now.',
          lastUpdated: new Date().toLocaleString(),
        }));
      } finally {
        setLoading(false);
      }
    };

    fetchPrediction();
    const interval = setInterval(fetchPrediction, PREDICTION_REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  const metricDetails = metricConfig.map((metric) => {
    const actualValue = prediction.actual[metric.key];
    const predictedValue = prediction.predicted[metric.key];
    const delta =
      typeof actualValue === 'number' && typeof predictedValue === 'number'
        ? predictedValue - actualValue
        : undefined;

    return {
      ...metric,
      actualValue,
      predictedValue,
      delta,
      trend: getTrendLabel(actualValue, predictedValue),
      status: getMetricStatus(metric.key, predictedValue),
      widths: getComparisonWidth(actualValue, predictedValue),
    };
  });

  const availablePredictions = metricDetails.filter((metric) => typeof metric.predictedValue === 'number').length;
  const safePredictions = metricDetails.filter((metric) => metric.status === 'safe').length;
  const alertPredictions = metricDetails.filter((metric) => metric.status === 'alert').length;
  const biggestShift = metricDetails
    .filter((metric) => typeof metric.delta === 'number')
    .sort((a, b) => Math.abs(b.delta || 0) - Math.abs(a.delta || 0))[0];
  const riskMetric = metricDetails.find((metric) => metric.status === 'alert');

  return (
    <Layout title="AI Quality Forecast" subtitle="Live next-reading forecasts with actual vs predicted insights">
      <div className="space-y-10">
        <div className="relative overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-700/80 bg-gradient-to-br from-sky-50 via-white to-emerald-50 dark:from-slate-950 dark:via-slate-900 dark:to-emerald-950/30 p-6 md:p-8 shadow-xl text-slate-900 dark:text-slate-100">
          <div className="pointer-events-none absolute -right-20 -top-20 h-48 w-48 rounded-full bg-sky-200/40 blur-3xl dark:bg-sky-700/20" />
          <div className="pointer-events-none absolute -bottom-20 left-10 h-40 w-40 rounded-full bg-emerald-200/40 blur-3xl dark:bg-emerald-700/20" />
          <div className="relative z-10 flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0 max-w-3xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-sky-200 dark:border-sky-800 bg-white/80 dark:bg-slate-900/80 px-3 py-1 text-xs font-semibold text-sky-700 dark:text-sky-300">
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                {PREDICTION_REFRESH_LABEL}
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">Next reading prediction at a glance</h2>
              <p className="mt-3 text-sm md:text-base text-slate-600 dark:text-slate-300">
                {prediction.statusText}
              </p>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                Last synced: {prediction.lastUpdated || 'Loading...'}
              </p>
            </div>

            <div className="grid w-full gap-4 sm:grid-cols-2 xl:max-w-md">
              <div className="min-w-0 rounded-2xl border border-emerald-200 dark:border-emerald-900/50 bg-white/90 dark:bg-slate-900/85 p-4 text-slate-900 dark:text-white">
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">Maintenance Outlook</p>
                <p className="mt-2 break-words text-2xl font-bold text-emerald-600 dark:text-emerald-400">{prediction.maintenance}</p>
              </div>
              <div className="min-w-0 rounded-2xl border border-amber-200 dark:border-amber-900/50 bg-white/90 dark:bg-slate-900/85 p-4 text-slate-900 dark:text-white">
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">Comparison Status</p>
                <p className="mt-2 text-2xl font-bold text-amber-600 dark:text-amber-400">
                  {Object.values(prediction.predicted).some((value) => typeof value === 'number') ? 'Ready' : 'Waiting'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid auto-rows-fr gap-5 md:grid-cols-2 2xl:grid-cols-4">
          <div className="flex h-full flex-col rounded-2xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-900/90 p-5 shadow-md text-slate-900 dark:text-slate-100">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">Predicted Metrics</p>
            <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{availablePredictions}/5</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">Model values available for the next reading</p>
          </div>
          <div className="flex h-full flex-col rounded-2xl border border-emerald-200 dark:border-emerald-900/50 bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/30 dark:to-slate-900 p-5 shadow-md text-slate-900 dark:text-slate-100">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">Safe Forecasts</p>
            <p className="mt-2 text-3xl font-bold text-emerald-600 dark:text-emerald-400">{safePredictions}</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">Parameters staying inside target range</p>
          </div>
          <div className="flex h-full flex-col rounded-2xl border border-rose-200 dark:border-rose-900/50 bg-gradient-to-br from-rose-50 to-white dark:from-rose-950/30 dark:to-slate-900 p-5 shadow-md text-slate-900 dark:text-slate-100">
            <p className="text-xs font-semibold uppercase tracking-wide text-rose-700 dark:text-rose-300">Attention Needed</p>
            <p className="mt-2 text-3xl font-bold text-rose-600 dark:text-rose-400">{alertPredictions}</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">Predicted values outside preferred limits</p>
          </div>
          <div className="flex h-full flex-col rounded-2xl border border-amber-200 dark:border-amber-900/50 bg-gradient-to-br from-amber-50 to-white dark:from-amber-950/30 dark:to-slate-900 p-5 shadow-md text-slate-900 dark:text-slate-100">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">Biggest Shift</p>
            <p className="mt-2 text-2xl font-bold text-amber-600 dark:text-amber-400">
              {biggestShift ? biggestShift.label : 'N/A'}
            </p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">
              {biggestShift && typeof biggestShift.delta === 'number'
                ? `${biggestShift.delta >= 0 ? '+' : ''}${biggestShift.delta.toFixed(2)} ${biggestShift.unit}`.trim()
                : 'No comparison available yet'}
            </p>
          </div>
        </div>

        <div className="grid auto-rows-fr gap-8 md:grid-cols-2 2xl:grid-cols-3">
          {metricDetails.map((metric) => {
            const Icon = metric.icon;
            const TrendIcon = metric.trend.icon;

            return (
              <div
                key={metric.key}
                className={`flex h-full min-w-0 flex-col rounded-3xl border ${metric.border} bg-gradient-to-br ${metric.bg} p-6 shadow-lg transition-transform hover:-translate-y-1 text-slate-900 dark:text-slate-100`}
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300">{metric.label}</p>
                    <h3 className={`mt-2 break-words text-3xl font-bold ${metric.color}`}>
                      {formatValue(metric.predictedValue, metric.unit)}
                    </h3>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-300">Predicted next 30-minute reading</p>
                  </div>
                  <div className={`w-fit shrink-0 rounded-2xl bg-white/80 dark:bg-slate-900/75 p-3 ${metric.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div className="min-w-0 rounded-2xl bg-white/80 dark:bg-slate-900/75 p-4 text-slate-900 dark:text-white">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-300">Actual</p>
                    <p className="mt-2 break-words text-lg font-semibold text-slate-900 dark:text-white">
                      {formatValue(metric.actualValue, metric.unit)}
                    </p>
                  </div>
                  <div className="min-w-0 rounded-2xl bg-white/80 dark:bg-slate-900/75 p-4 text-slate-900 dark:text-white">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-300">Difference</p>
                    <p className="mt-2 break-words text-lg font-semibold text-slate-900 dark:text-white">
                      {typeof metric.delta === 'number' ? `${metric.delta >= 0 ? '+' : ''}${metric.delta.toFixed(2)}${metric.unit ? ` ${metric.unit}` : ''}` : 'N/A'}
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex flex-1 flex-col justify-end space-y-4">
                  <div className="rounded-2xl border border-slate-200/70 dark:border-slate-700/70 bg-white/85 dark:bg-slate-900/85 p-4 text-slate-900 dark:text-white">
                    <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                      <span>Actual</span>
                      <span>{formatValue(metric.actualValue, metric.unit)}</span>
                    </div>
                    <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                      <div className="h-full rounded-full bg-slate-500" style={{ width: `${metric.widths.actual}%` }} />
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                      <span>Predicted</span>
                      <span>{formatValue(metric.predictedValue, metric.unit)}</span>
                    </div>
                    <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                      <div className="h-full rounded-full bg-gradient-to-r from-sky-500 to-emerald-500" style={{ width: `${metric.widths.predicted}%` }} />
                    </div>
                  </div>

                  <div className={`inline-flex w-fit items-center gap-2 rounded-full border border-slate-200/70 dark:border-slate-700/70 bg-white/85 dark:bg-slate-900/85 px-3 py-1.5 text-sm font-semibold ${metric.trend.tone}`}>
                    <TrendIcon className="h-4 w-4" />
                    {metric.trend.text}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid items-stretch gap-8 2xl:grid-cols-[1.35fr_0.95fr]">
          <div className="flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-900/95 p-6 shadow-lg text-slate-900 dark:text-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">Actual vs Predicted Comparison</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">Quick side-by-side view of the latest real sample and the next 30-minute AI forecast.</p>
              </div>
            </div>

            <div className="mt-6 flex-1 overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-950/70">
              <table className="w-full min-w-[560px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700/80 bg-white/90 dark:bg-slate-900/90 text-xs uppercase tracking-wide text-slate-500 dark:text-slate-300">
                    <th className="px-4 py-4 font-semibold">Parameter</th>
                    <th className="px-4 py-4 font-semibold">Actual</th>
                    <th className="px-4 py-4 font-semibold">Predicted</th>
                    <th className="px-4 py-4 font-semibold">Change</th>
                    <th className="px-4 py-4 font-semibold">Trend</th>
                  </tr>
                </thead>
                <tbody className="bg-slate-50 dark:bg-slate-950/70">
                  {metricConfig.map((metric) => {
                    const details = metricDetails.find((item) => item.key === metric.key)!;

                    return (
                      <tr key={metric.key} className="border-b border-slate-200 dark:border-slate-800/80 bg-transparent last:border-0">
                        <td className="px-4 py-4 font-semibold text-slate-900 dark:text-white">{metric.label}</td>
                        <td className="px-4 py-4 text-slate-600 dark:text-slate-300">{formatValue(details.actualValue, metric.unit)}</td>
                        <td className="px-4 py-4 font-semibold text-slate-900 dark:text-white">{formatValue(details.predictedValue, metric.unit)}</td>
                        <td className="px-4 py-4 text-slate-600 dark:text-slate-300">
                          {typeof details.delta === 'number' ? `${details.delta >= 0 ? '+' : ''}${details.delta.toFixed(2)}${metric.unit ? ` ${metric.unit}` : ''}` : 'N/A'}
                        </td>
                        <td className={`px-4 py-4 font-semibold ${details.trend.tone}`}>{details.trend.text}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid auto-rows-fr gap-8">
            <div className="flex h-full flex-col rounded-3xl border border-amber-200 dark:border-amber-900/50 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 p-6 shadow-lg text-slate-900 dark:text-slate-100">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-6 w-6 text-amber-500" />
                <div className="min-w-0">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Maintenance Insight</h3>
                  <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">
                    {prediction.maintenance === 'Required Soon'
                      ? 'Predicted values suggest the system may need inspection soon, especially if dissolved solids or turbidity continue to rise.'
                      : 'Predicted values remain within the usual operating band, so immediate maintenance is not indicated.'}
                  </p>
                  <div className="mt-5 rounded-2xl border border-amber-200/70 dark:border-amber-900/50 bg-white/80 dark:bg-slate-900/70 p-4 text-sm text-slate-600 dark:text-slate-300">
                    <span className="font-semibold text-slate-900 dark:text-white">Priority parameter:</span>{' '}
                    {riskMetric ? `${riskMetric.label} is the first value predicted to move outside the preferred range.` : 'No immediate risk parameter detected.'}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex h-full flex-col rounded-3xl border border-emerald-200 dark:border-emerald-900/50 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 p-6 shadow-lg text-slate-900 dark:text-slate-100">
              <div className="flex items-start gap-3">
                <CheckCircle className="mt-0.5 h-6 w-6 text-emerald-500" />
                <div className="min-w-0">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">What This Means</h3>
                  <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">
                    Use the predicted column as the expected next 30-minute reading from the model, and compare it with the actual column to understand whether water quality is likely to improve, worsen, or remain steady.
                  </p>
                  <div className="mt-5 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl border border-emerald-200/70 dark:border-emerald-900/50 bg-white/80 dark:bg-slate-900/70 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">Forecast health</p>
                      <p className="mt-2 text-xl font-bold text-slate-900 dark:text-white">
                        {safePredictions >= 4 ? 'Strong' : safePredictions >= 2 ? 'Moderate' : 'Watch closely'}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-emerald-200/70 dark:border-emerald-900/50 bg-white/80 dark:bg-slate-900/70 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">Prediction confidence</p>
                      <p className="mt-2 text-xl font-bold text-slate-900 dark:text-white">
                        {availablePredictions === 5 ? 'Complete data' : 'Partial data'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
