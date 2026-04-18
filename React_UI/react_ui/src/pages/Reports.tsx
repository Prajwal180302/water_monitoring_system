import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
} from "recharts";
import { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';
import { Download, Filter, X, HelpCircle } from 'lucide-react';
import { Layout } from '../components/Layout';

interface ReportData {
  device_id?: string;
  summary?: {
    pH?: { avg: number; min: number; max: number };
    TDS?: { avg: number; min: number; max: number };
    Turbidity?: { avg: number; min: number; max: number };
    Temperature?: { avg: number; min: number; max: number };
    Conductivity?: { avg: number; min: number; max: number };
  };
  alerts?: {
    total_unsafe_readings?: number;
    safety_percentage?: number;
    violations_by_parameter?: any;
  };
  data?: any[];
}

export function Reports() {
  const [reportType, setReportType] = useState('overview');
  const [chartType, setChartType] = useState('line');
  const [reportData, setReportData] = useState<ReportData>({});
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [selectedParams, setSelectedParams] = useState<string[]>(['pH', 'tds', 'temperature', 'turbidity', 'conductivity']);
  const [showFilters, setShowFilters] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [showSafety, setShowSafety] = useState(false);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [granularity, setGranularity] = useState('detailed'); // detailed, hourly, daily
  const [timePreset, setTimePreset] = useState('all'); // all, 24h, 7d, 30d
  const [chartHeight, setChartHeight] = useState(450);
  const [phBoost, setPhBoost] = useState(false);
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const res = await axiosInstance.get("/reports");

// KEEP THIS
setReportData(res.data);

// 🔥 REPLACE chart logic with this
const formatted = res.data.data.map((item: any) => ({
  time: new Date(item.timestamp).toLocaleTimeString(),
  pH: item.pH,
  tds: item.tds,
  turbidity: item.turbidity,
  conductivity: item.conductivity,
  temperature: item.temperature,
}));

// 🔥 VERY IMPORTANT (sort properly)
formatted.sort(
  (a: any, b: any) =>
    new Date(a.time).getTime() - new Date(b.time).getTime()
);

setChartData(formatted);
      } catch (err) {
        console.error("Report API ERROR:", err);
        setReportData({});
      }
    };

    fetchReport();
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = reportData.data || [];

    // Apply time preset
    if (timePreset !== 'all') {
      const now = new Date();
      let cutoffDate = new Date();
      
      switch(timePreset) {
        case '24h':
          cutoffDate.setHours(now.getHours() - 24);
          break;
        case '7d':
          cutoffDate.setDate(now.getDate() - 7);
          break;
        case '30d':
          cutoffDate.setDate(now.getDate() - 30);
          break;
      }
      
      filtered = filtered.filter(item => new Date(item.timestamp) >= cutoffDate);
    }

    if (dateRange.start) {
      filtered = filtered.filter(item => 
        new Date(item.timestamp) >= new Date(dateRange.start)
      );
    }

    if (dateRange.end) {
      filtered = filtered.filter(item => 
        new Date(item.timestamp) <= new Date(dateRange.end)
      );
    }

    // Apply granularity sampling
    let sampleRate = 1;
    switch(granularity) {
      case 'hourly':
        sampleRate = Math.ceil(filtered.length / 24); // ~24 points
        break;
      case 'daily':
        sampleRate = Math.ceil(filtered.length / 7); // ~7 points
        break;
      case 'detailed':
      default:
        sampleRate = Math.max(1, Math.ceil(filtered.length / 100)); // ~100 points
        break;
    }
    
    filtered = filtered.filter((_, i) => i % sampleRate === 0);

    setFilteredData(filtered);
  }, [dateRange, reportData.data, granularity, timePreset]);

  const toggleParam = (param: string) => {
    setSelectedParams(prev => 
      prev.includes(param) 
        ? prev.filter(p => p !== param)
        : [...prev, param]
    );
  };

  const getReportContent = () => {
    switch(reportType) {
      case 'quality':
        return {
          title: 'Water Quality Analysis',
          description: 'Detailed breakdown of all water quality parameters over time with trend analysis',
          guidance: 'Monitor trends in pH, TDS, turbidity, temperature, and conductivity. Look for sudden spikes or dips that may indicate issues.',
          icon: '💧'
        };
      case 'safety':
        return {
          title: 'Safety & Compliance Report',
          description: 'Safety percentage, violations, and compliance metrics with detailed parameter breakdowns',
          guidance: 'Focuses on safe vs unsafe readings. Safety percentage above 95% is recommended. Review violations by parameter.',
          icon: '🛡️'
        };
      case 'trends':
        return {
          title: 'Trends & Anomalies Detection',
          description: 'Identify patterns, trends, and potential anomalies in water quality data',
          guidance: 'Use this report to spot unusual patterns. Red flags: sudden spikes/drops, repeated violations, drifting baseline values.',
          icon: '📈'
        };
      case 'daily':
        return {
          title: 'Daily Statistics Report',
          description: 'Aggregated daily summaries showing min, max, and average values for each parameter',
          guidance: 'Compare daily patterns to establish normal baseline. Early morning vs afternoon variations can be normal.',
          icon: '📅'
        };
      case 'compliance':
        return {
          title: 'Regulatory Compliance Report',
          description: 'Detailed compliance metrics against water quality standards (WHO/EPA guidelines)',
          guidance: 'Ensures all readings meet safe drinking water standards. Track compliance percentage trend over time.',
          icon: '✅'
        };
      case 'comparison':
        return {
          title: 'Parameter Comparison Analysis',
          description: 'Compare relationships between different parameters and their correlations',
          guidance: 'Identify how parameters influence each other (e.g., temperature effects on conductivity, pH impacts on safety).',
          icon: '🔄'
        };
      case 'overview':
      default:
        return {
          title: 'System Overview',
          description: 'High-level summary of all metrics and system health with key performance indicators',
          guidance: 'Start here for a quick assessment. Check min/max values to identify anomalies.',
          icon: '📊'
        };
    }
  };

  const renderReportSpecificMetrics = () => {
    if (reportType === 'safety' || reportType === 'compliance') {
      return (
        <div className="mb-8 grid gap-5 lg:grid-cols-4">
          <div className="rounded-lg border border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950 p-4 shadow-sm">
            <p className="text-sm font-medium text-green-700 dark:text-green-300">Safe Readings</p>
            <p className="mt-2 text-2xl font-bold text-green-600 dark:text-green-400">
              {reportData.data ? Math.round((reportData.alerts?.safety_percentage || 0) * reportData.data.length / 100) : 0}
            </p>
            <p className="text-xs text-green-600 dark:text-green-400 mt-1">of {reportData.data?.length || 0}</p>
          </div>
          <div className="rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950 p-4 shadow-sm">
            <p className="text-sm font-medium text-red-700 dark:text-red-300">Unsafe Readings</p>
            <p className="mt-2 text-2xl font-bold text-red-600 dark:text-red-400">
              {reportData.alerts?.total_unsafe_readings || 0}
            </p>
            <p className="text-xs text-red-600 dark:text-red-400 mt-1">violations detected</p>
          </div>
          <div className="rounded-lg border border-yellow-200 dark:border-yellow-900 bg-yellow-50 dark:bg-yellow-950 p-4 shadow-sm">
            <p className="text-sm font-medium text-yellow-700 dark:text-yellow-300">Compliance Rate</p>
            <p className="mt-2 text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {typeof reportData.alerts?.safety_percentage === 'number' 
                ? reportData.alerts.safety_percentage.toFixed(1) 
                : 0}%
            </p>
            <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">target: 95%+</p>
          </div>
          <div className="rounded-lg border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950 p-4 shadow-sm">
            <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Data Points</p>
            <p className="mt-2 text-2xl font-bold text-blue-600 dark:text-blue-400">
              {reportData.data?.length || 0}
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">readings analyzed</p>
          </div>
        </div>
      );
    }

    if (reportType === 'trends') {
      const calcTrend = (key: string) => {
        if (!filteredData || filteredData.length < 2) return 'neutral';
        const first = filteredData[0][key];
        const last = filteredData[filteredData.length - 1][key];
        if (!first || !last) return 'neutral';
        return last > first ? 'up' : last < first ? 'down' : 'neutral';
      };

      return (
        <div className="mb-8 grid gap-5 lg:grid-cols-5">
          {[
            { key: 'pH', label: 'pH Trend', color: '#8b5cf6' },
            { key: 'tds', label: 'TDS Trend', color: '#3b82f6' },
            { key: 'temperature', label: 'Temp Trend', color: '#f97316' },
            { key: 'turbidity', label: 'Turbidity Trend', color: '#06b6d4' },
            { key: 'conductivity', label: 'Conductivity Trend', color: '#10b981' },
          ].map(param => {
            const trend = calcTrend(param.key);
            return (
              <div key={param.key} className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{param.label}</p>
                <p className="mt-2 text-2xl font-bold" style={{ color: param.color }}>
                  {trend === 'up' ? '📈' : trend === 'down' ? '📉' : '→'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {trend === 'up' ? 'Increasing' : trend === 'down' ? 'Decreasing' : 'Stable'}
                </p>
              </div>
            );
          })}
        </div>
      );
    }

    if (reportType === 'comparison') {
      return (
        <div className="mb-8 grid gap-5 lg:grid-cols-2">
          <div className="rounded-lg border border-purple-200 dark:border-purple-900 bg-purple-50 dark:bg-purple-950 p-4 shadow-sm">
            <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-3">Parameter Ranges</h4>
            <div className="space-y-2 text-sm">
              {reportData.summary && Object.entries(reportData.summary).map(([key, stats]: [string, any]) => (
                <div key={key} className="flex justify-between items-center">
                  <span className="text-gray-700 dark:text-gray-300">{key}:</span>
                  <span className="font-mono text-purple-600 dark:text-purple-300">
                    {stats?.min?.toFixed(2)} - {stats?.max?.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-indigo-200 dark:border-indigo-900 bg-indigo-50 dark:bg-indigo-950 p-4 shadow-sm">
            <h4 className="font-semibold text-indigo-900 dark:text-indigo-100 mb-3">Key Correlations</h4>
            <div className="space-y-2 text-sm">
              <p className="text-gray-700 dark:text-gray-300">🌡️ <span className="font-semibold">Temperature</span> affects conductivity</p>
              <p className="text-gray-700 dark:text-gray-300">⚗️ <span className="font-semibold">pH</span> impacts mineral content (TDS)</p>
              <p className="text-gray-700 dark:text-gray-300">💧 <span className="font-semibold">Turbidity</span> indicates contamination</p>
              <p className="text-gray-700 dark:text-gray-300">⚡ <span className="font-semibold">Conductivity</span> shows dissolved minerals</p>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  const downloadReport = (format: string) => {
    if (format === 'csv' && reportData.data) {
      const csvContent = [
        ['Timestamp', 'pH', 'TDS', 'Turbidity', 'Conductivity', 'Temperature'],
        ...reportData.data.map((row: any) => [
          row.timestamp || '',
          row.pH || '',
          row.tds || '',
          row.turbidity || '',
          row.conductivity || '',
          row.temperature || '',
        ]),
      ]
        .map((row) => row.join(','))
        .join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `water-monitoring-report-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
    }
  };

  const renderChart = () => {
    const baseChartData = filteredData.map((item: any, i: number) => {
      const date = new Date(item.timestamp);
      let timeLabel = '';
      
      // Smart labeling based on granularity and data points
      if (filteredData.length <= 10) {
        // Show all labels if few points
        timeLabel = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } else if (i % Math.ceil(filteredData.length / 8) === 0 || i === filteredData.length - 1) {
        // Show ~8 labels across chart
        const isToday = new Date().toDateString() === date.toDateString();
        if (isToday) {
          timeLabel = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else {
          timeLabel = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
        }
      }
      
      return {
        ...item,
        time: timeLabel,
        name: date.toLocaleString(),
      };
    });

    // For line/area charts, scale pH to make it visible
    const chartData = baseChartData.map(item => ({
      ...item,
      pH_scaled: (item.pH || 0) * 10, // Scale pH for visibility (0-14 becomes 0-140)
    }));

    const commonMargin = { top: 20, right: 30, left: 10, bottom: 60 };

    switch(chartType) {
      case 'area':
        return (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <AreaChart data={chartData} margin={commonMargin}>
              <defs>
                <linearGradient id="colorPH" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="colorTDS" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#fb923c" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0.1}/>
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.3} />
              <XAxis dataKey="time" angle={-45} textAnchor="end" height={100} tick={{ fontSize: 12, fill: '#4b5563' }} />
              <YAxis tick={{ fontSize: 12, fill: '#4b5563' }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1f2937', 
                  border: '2px solid #3b82f6', 
                  borderRadius: '12px', 
                  color: '#fff',
                  padding: '12px',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.3)'
                }}
                formatter={(value: any, name: any) => {
                  if (name === '🔵 pH Level' || name === '🔵 pH Level (BOOSTED)') {
                    return [(value / 7).toFixed(2), name];
                  }
                  return typeof value === 'number' ? value.toFixed(2) : value;
                }}
              />
              <Legend 
                wrapperStyle={{ paddingTop: '20px', fontSize: '13px', fontWeight: 'bold' }}
              />
              {selectedParams.includes('pH') && <Area yAxisId="right" type="monotone" dataKey="pH_scaled" stackId="1" stroke="#8b5cf6" strokeWidth={3} fill="url(#colorPH)" name="🔵 pH Level" isAnimationActive={true} filter="url(#glow)" />}
              {selectedParams.includes('tds') && <Area type="monotone" dataKey="tds" stackId="2" stroke="#3b82f6" strokeWidth={3} fill="url(#colorTDS)" name="🌊 TDS" isAnimationActive={true} filter="url(#glow)" />}
              {selectedParams.includes('temperature') && <Area type="monotone" dataKey="temperature" stackId="3" stroke="#f97316" strokeWidth={3} fill="url(#colorTemp)" name="🌡️ Temperature" isAnimationActive={true} filter="url(#glow)" />}
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <BarChart data={chartData} margin={commonMargin}>
              <defs>
                <linearGradient id="barGrad1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#a78bfa" stopOpacity={1}/>
                  <stop offset="100%" stopColor="#7c3aed" stopOpacity={1}/>
                </linearGradient>
                <linearGradient id="barGrad2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#60a5fa" stopOpacity={1}/>
                  <stop offset="100%" stopColor="#1e40af" stopOpacity={1}/>
                </linearGradient>
                <linearGradient id="barGrad3" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#fb923c" stopOpacity={1}/>
                  <stop offset="100%" stopColor="#dc2626" stopOpacity={1}/>
                </linearGradient>
                <filter id="barShadow">
                  <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.3"/>
                </filter>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.3} />
              <XAxis dataKey="time" angle={-45} textAnchor="end" height={100} tick={{ fontSize: 12, fill: '#4b5563' }} />
              <YAxis tick={{ fontSize: 12, fill: '#4b5563' }} yAxisId="left" />
              <YAxis 
                yAxisId="right" 
                orientation="right" 
                tick={{ fontSize: 12, fill: '#a78bfa', fontWeight: '500' }}
                domain={[0, 14]}
                tickFormatter={(value) => value.toFixed(1)}
                label={{ value: 'pH', angle: -90, position: 'insideRight', style: { textAnchor: 'middle', fill: '#a78bfa', fontWeight: 'bold' } }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1f2937', 
                  border: '2px solid #3b82f6', 
                  borderRadius: '12px', 
                  color: '#fff',
                  padding: '12px',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.3)'
                }}
                formatter={(value: any, name: any) => {
                  if (name === '🔵 pH Level' || name === '🔵 pH Level (BOOSTED)') {
                    return [(value / 7).toFixed(2), name];
                  }
                  return typeof value === 'number' ? value.toFixed(2) : value;
                }}
              />
              <Legend 
                wrapperStyle={{ paddingTop: '20px', fontSize: '13px', fontWeight: 'bold' }}
              />
              {selectedParams.includes('pH') && <Bar dataKey="pH" fill="url(#barGrad1)" name="🔵 pH Level" radius={[8, 8, 0, 0]} />}
              {selectedParams.includes('tds') && <Bar dataKey="tds" fill="url(#barGrad2)" name="🌊 TDS" radius={[8, 8, 0, 0]} />}
              {selectedParams.includes('temperature') && <Bar dataKey="temperature" fill="url(#barGrad3)" name="🌡️ Temperature" radius={[8, 8, 0, 0]} />}
            </BarChart>
          </ResponsiveContainer>
        );

      case 'scatter':
        return (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <ScatterChart data={baseChartData} margin={{ top: 20, right: 20, bottom: 60, left: 60 }}>
              <defs>
                <filter id="dotGlow">
                  <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.3} />
              <XAxis 
                dataKey="pH" 
                name="pH" 
                label={{ value: '🔵 pH Level', position: 'insideBottomRight', offset: -10 }} 
                tick={{ fontSize: 12, fill: '#4b5563', fontWeight: '500' }} 
              />
              <YAxis 
                dataKey="temperature" 
                name="Temperature" 
                label={{ value: '🌡️ Temperature (°C)', angle: -90, position: 'insideLeft' }} 
                tick={{ fontSize: 12, fill: '#4b5563', fontWeight: '500' }} 
              />
              <Tooltip 
                cursor={{ strokeDasharray: '3 3', stroke: '#a78bfa' }} 
                contentStyle={{ 
                  backgroundColor: '#1f2937', 
                  border: '2px solid #8b5cf6', 
                  borderRadius: '12px', 
                  color: '#fff',
                  padding: '12px',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
                  fontWeight: '600'
                }}
                formatter={(value: any) => typeof value === 'number' ? value.toFixed(2) : value}
              />
              <Scatter name="pH vs Temperature" data={baseChartData} fill="#a78bfa" shape="circle" filter="url(#dotGlow)" />
            </ScatterChart>
          </ResponsiveContainer>
        );

      case 'line':
      default:
        return (
          <ResponsiveContainer width="100%" height={chartHeight}>
            <LineChart data={chartData} margin={commonMargin}>
              <defs>
                <filter id="lineGlow">
                  <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
                <filter id="phGlowBright">
                  <feGaussianBlur stdDeviation="3.5" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.3} />
              <XAxis 
                dataKey="time" 
                angle={-45} 
                textAnchor="end" 
                height={100} 
                tick={{ fontSize: 12, fill: '#4b5563', fontWeight: '500' }} 
              />
              <YAxis 
                tick={{ fontSize: 12, fill: '#4b5563', fontWeight: '500' }} 
                yAxisId="left"
              />
              <YAxis 
                yAxisId="right" 
                orientation="right" 
                tick={{ fontSize: 12, fill: '#d8b4fe', fontWeight: '500' }}
                domain={[0, 14]}
                tickFormatter={(value) => value.toFixed(1)}
                label={{ value: 'pH', angle: -90, position: 'insideRight', style: { textAnchor: 'middle', fill: '#d8b4fe', fontWeight: 'bold' } }}
              />ool
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1f2937', 
                  border: '2px solid #3b82f6', 
                  borderRadius: '12px', 
                  color: '#fff',
                  padding: '12px',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
                  fontWeight: '600'
                }}
                formatter={(value: any, name: any) => {
                  if (name.includes('pH')) {
                    // Convert scaled pH back to original value
                    const originalPh = typeof value === 'number' ? value / 10 : value;
                    return [originalPh.toFixed(2), name];
                  }
                  return typeof value === 'number' ? value.toFixed(2) : value;
                }}
                 
                labelFormatter={(label) => `Time: ${label}`}
              />
              <Legend 
                wrapperStyle={{ paddingTop: '20px', fontSize: '13px', fontWeight: 'bold' }}
              />
              {selectedParams.includes('pH') && <Line yAxisId="right" type="monotone" dataKey="pH_scaled" stroke={phBoost ? "#fbbf24" : "#d8b4fe"} strokeWidth={phBoost ? 10 : 7} dot={{ r: phBoost ? 6 : 4, fill: phBoost ? "#fbbf24" : "#d8b4fe" }} name={phBoost ? "🔵 pH Level (BOOSTED)" : "🔵 pH Level"} isAnimationActive={true} filter={phBoost ? "url(#phGlowBright)" : "url(#lineGlow)"} />}
              {selectedParams.includes('tds') && <Line type="monotone" dataKey="tds" stroke="#60a5fa" strokeWidth={4} dot={false} name="🌊 TDS" isAnimationActive={true} filter="url(#lineGlow)" />}
              {selectedParams.includes('temperature') && <Line type="monotone" dataKey="temperature" stroke="#fb923c" strokeWidth={4} dot={false} name="🌡️ Temperature" isAnimationActive={true} filter="url(#lineGlow)" />}
              {selectedParams.includes('turbidity') && <Line type="monotone" dataKey="turbidity" stroke="#22d3ee" strokeWidth={4} dot={false} name="💧 Turbidity" isAnimationActive={true} filter="url(#lineGlow)" />}
              {selectedParams.includes('conductivity') && <Line type="monotone" dataKey="conductivity" stroke="#4ade80" strokeWidth={4} dot={false} name="⚡ Conductivity" isAnimationActive={true} filter="url(#lineGlow)" />}
            </LineChart>
          </ResponsiveContainer>
        );
      
      case 'panels':
        const paramDefs = [
          { key: 'pH', label: 'pH', color: '#a78bfa', lightColor: '#ede9fe', icon: '🔵' },
          { key: 'tds', label: 'TDS', color: '#60a5fa', lightColor: '#dbeafe', icon: '🌊' },
          { key: 'temperature', label: 'Temperature', color: '#fb923c', lightColor: '#fed7aa', icon: '🌡️' },
          { key: 'turbidity', label: 'Turbidity', color: '#22d3ee', lightColor: '#cffafe', icon: '💧' },
          { key: 'conductivity', label: 'Conductivity', color: '#4ade80', lightColor: '#dcfce7', icon: '⚡' },
        ];
        return (
          <div className="grid gap-6 lg:grid-cols-2">
            {paramDefs.filter(p => selectedParams.includes(p.key)).map(param => (
              <div key={param.key} className="border-3 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all hover:scale-[1.02] bg-gradient-to-br from-white to-gray-50 dark:from-gray-700 dark:to-gray-800 dark:border-gray-600" style={{ borderColor: param.color }}>
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl">{param.icon}</div>
                    <div>
                      <h3 className="font-bold text-xl text-gray-900 dark:text-white">{param.label}</h3>
                    </div>
                  </div>
                  <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg text-white" style={{ backgroundColor: param.color }}>
                    {param.icon}
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={baseChartData}>
                    <defs>
                      <linearGradient id={`panelGrad${param.key}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={param.color} stopOpacity={0.3}/>
                        <stop offset="100%" stopColor={param.color} stopOpacity={0}/>
                      </linearGradient>
                      <filter id={`panelGlow${param.key}`}>
                        <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
                        <feMerge>
                          <feMergeNode in="coloredBlur"/>
                          <feMergeNode in="SourceGraphic"/>
                        </feMerge>
                      </filter>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.3} />
                    <XAxis dataKey="time" fontSize={11} tick={{ fill: '#4b5563', fontWeight: '500' }} />
                    <YAxis fontSize={11} tick={{ fill: '#4b5563', fontWeight: '500' }} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1f2937', 
                        border: `3px solid ${param.color}`, 
                        borderRadius: '12px', 
                        color: '#fff', 
                        fontSize: '12px',
                        padding: '10px',
                        fontWeight: '600',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.3)'
                      }}
                      formatter={(value: any) => typeof value === 'number' ? value.toFixed(2) : value}
                      labelFormatter={(label) => `Time: ${label}`}
                    />
                    <Line type="monotone" dataKey={param.key} stroke={param.color} strokeWidth={4} dot={false} isAnimationActive={true} filter={`url(#panelGlow${param.key})`} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ))}
          </div>
        );
    }
  };

  return (
    <Layout title="Reports & Analytics" subtitle="View and analyze comprehensive water quality reports with multiple visualization types">
      {/* Help Modal */}
      {showGuide && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">User Guide - Reports & Analytics</h2>
              <button onClick={() => setShowGuide(false)} className="text-white hover:bg-blue-800 p-1 rounded">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">📊 Report Types</h3>
                <ul className="space-y-3 text-gray-700 dark:text-gray-300">
                  <li className="flex gap-3">
                    <span className="text-blue-600 font-bold">System Overview:</span>
                    <span>Quick health check with summary statistics for all parameters - best starting point</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-green-600 font-bold">Water Quality Analysis:</span>
                    <span>In-depth analysis of pH, TDS, turbidity, temperature, and conductivity trends over time</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-red-600 font-bold">Safety & Compliance:</span>
                    <span>Compliance report showing safe percentage and parameter violations with detailed breakdowns</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-orange-600 font-bold">Trends & Anomalies:</span>
                    <span>Spot unusual patterns, sudden spikes/drops, and drifting baseline values that need attention</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-purple-600 font-bold">Daily Statistics:</span>
                    <span>Aggregated daily summaries showing min, max, and average values for trend comparison</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-teal-600 font-bold">Regulatory Compliance:</span>
                    <span>Detailed compliance against WHO/EPA standards with specific parameter thresholds</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-indigo-600 font-bold">Parameter Comparison:</span>
                    <span>Analyze relationships and correlations between different parameters for deeper insights</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">📈 Chart Types</h3>
                <ul className="space-y-3 text-gray-700 dark:text-gray-300">
                  <li className="flex gap-3">
                    <span className="text-blue-600 font-bold">Line Chart:</span>
                    <span>Best for viewing trends over time - shows each parameter as a line</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-purple-600 font-bold">Area Chart:</span>
                    <span>Shows magnitude and trends with filled areas - easier to see importance</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-green-600 font-bold">Bar Chart:</span>
                    <span>Compares values across discrete time periods - last 30 readings shown</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-orange-600 font-bold">Scatter Plot:</span>
                    <span>Visualizes relationship between pH and temperature for anomaly detection</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">🔍 Filters & Customization</h3>
                <ul className="space-y-2 text-gray-700 dark:text-gray-300 text-sm">
                  <li>• <span className="font-semibold">Date Range:</span> Filter data by start and end dates</li>
                  <li>• <span className="font-semibold">Parameters:</span> Toggle individual parameters on/off</li>
                  <li>• <span className="font-semibold">Data Sampling:</span> Charts auto-sample for 100+ points to stay clean</li>
                  <li>• <span className="font-semibold">Reset:</span> Click "Reset Filters" to return to default view</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">⚡ Early Precautions (BEFORE Operation)</h3>
                <ul className="space-y-2 text-gray-700 dark:text-gray-300 text-sm">
                  <li className="flex gap-2">
                    <span className="text-blue-600 font-bold">1️⃣</span>
                    <span><span className="font-semibold">Site Inspection:</span> Check sensor placement, secure mounting, protection from sunlight and splashes</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-blue-600 font-bold">2️⃣</span>
                    <span><span className="font-semibold">Power & Network:</span> Ensure stable power supply (use UPS if critical) and reliable WiFi/network connectivity</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-blue-600 font-bold">3️⃣</span>
                    <span><span className="font-semibold">Clean & Calibrate:</span> Clean sensors before first use and perform manufacturer calibration. Record baseline readings</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-blue-600 font-bold">4️⃣</span>
                    <span><span className="font-semibold">Test Run (24-48hrs):</span> Run system for 1-2 days and verify trends match expected patterns vs. reference sample</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-blue-600 font-bold">5️⃣</span>
                    <span><span className="font-semibold">Conservative Thresholds:</span> Set initial alert thresholds with buffer margin. Test alerts and escalation channels</span>
                  </li>
                </ul>
              </div>
                <ul className="space-y-2 text-gray-700 dark:text-gray-300 text-sm">
                  <li className="flex gap-2">
                    <span className="text-red-600 font-bold">⚠️</span>
                    <span><span className="font-semibold">Never ignore safety alerts:</span> Red alerts indicate unsafe water conditions</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-red-600 font-bold">⚠️</span>
                    <span><span className="font-semibold">Regular sensor maintenance:</span> Clean sensors monthly for accurate readings</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-red-600 font-bold">⚠️</span>
                    <span><span className="font-semibold">Calibration importance:</span> Calibrate sensors quarterly or when readings seem off</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-red-600 font-bold">⚠️</span>
                    <span><span className="font-semibold">pH range (6.5-8.5):</span> Outside this range indicates potential chemical imbalance</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-red-600 font-bold">⚠️</span>
                    <span><span className="font-semibold">TDS levels:</span> Safe drinking water TDS should be below 500 ppm</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-red-600 font-bold">⚠️</span>
                    <span><span className="font-semibold">Turbidity check:</span> High turbidity (&gt;5 NTU) suggests contamination</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-red-600 font-bold">⚠️</span>
                    <span><span className="font-semibold">Temperature monitoring:</span> Ideal range is 10-15°C for storage, 16-25°C for usage</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-red-600 font-bold">⚠️</span>
                    <span><span className="font-semibold">Report anomalies immediately:</span> Any sudden spike/drop may indicate sensor failure or real issue</span>
                  </li>
                </ul>
              </div>

              <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <h4 className="font-semibold text-red-900 dark:text-red-100 mb-2">🚨 Emergency Protocol</h4>
                <p className="text-sm text-red-800 dark:text-red-200 mb-2">If system shows:</p>
                <ul className="text-sm text-red-800 dark:text-red-200 space-y-1">
                  <li>• <span className="font-semibold">Sudden spike in all parameters:</span> Possible sensor malfunction - Contact support</li>
                  <li>• <span className="font-semibold">All values dropping to zero:</span> Check connection & power supply</li>
                  <li>• <span className="font-semibold">Safety &lt; 80%:</span> Assess water source & take corrective action</li>
                </ul>
              </div>
            </div>
          </div>
        
      )}

      {/* Main Controls */}
      <div className="mb-6 grid gap-4 lg:grid-cols-4">
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm">
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Report Type</label>
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/50 px-3 py-2 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none"
          >
            <option value="overview">📊 System Overview</option>
            <option value="quality">💧 Water Quality Analysis</option>
            <option value="safety">🛡️ Safety & Compliance</option>
            <option value="trends">📈 Trends & Anomalies</option>
            <option value="daily">📅 Daily Statistics</option>
            <option value="compliance">✅ Regulatory Compliance</option>
            <option value="comparison">🔄 Parameter Comparison</option>
          </select>
        </div>

        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm">
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Chart Type</label>
          <select
            value={chartType}
            onChange={(e) => setChartType(e.target.value)}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/50 px-3 py-2 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none"
          >
            <option value="line">📈 Line Chart</option>
            <option value="area">📊 Area Chart</option>
            <option value="bar">📉 Bar Chart</option>
            <option value="scatter">🔵 Scatter Plot</option>
            <option value="panels">☰ Panels (one chart per parameter)</option>
          </select>
        </div>

        <div className="flex gap-2 items-end">
          <button
            onClick={() => setShowGuide(true)}
            title="User Guide"
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-600 text-white font-medium hover:bg-purple-700 transition-colors"
          >
            <HelpCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Guide</span>
          </button>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              showFilters
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            <Filter className="h-4 w-4" />
            Filters
          </button>

          <button
            onClick={() => downloadReport('csv')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 transition-colors"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
        </div>
      </div>

      {/* Report Type Info Banner */}
      {(() => {
        const info = getReportContent();
        return (
          <div className="mb-6 rounded-lg border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950 p-4 flex items-start gap-3">
            <span className="text-2xl">{info.icon}</span>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">{info.title}</h3>
              <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{info.description}</p>
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-2 font-medium">💡 {info.guidance}</p>
            </div>
          </div>
        );
      })()}

      {/* Safety Precautions Quick Toggle */}
      <div className="mb-12">
        <button
          onClick={() => setShowSafety(!showSafety)}
          className="w-full flex items-center justify-between bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900 rounded-lg p-4 hover:bg-red-100 dark:hover:bg-red-900 transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">🛡️</span>
            <div className="text-left">
              <h3 className="font-bold text-red-900 dark:text-red-100">Safety & Normal Ranges</h3>
              <p className="text-xs text-red-700 dark:text-red-300">Click to expand safe parameter ranges and maintenance tips</p>
            </div>
          </div>
          <span className="text-xl">{showSafety ? '▼' : '▶'}</span>
        </button>

        {showSafety && (
          <div className="mt-6 rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950 p-8">
            <div className="grid gap-6 lg:grid-cols-5">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-red-100 dark:border-red-900 shadow-sm hover:shadow-md transition-shadow">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">pH Level</h4>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400 mb-3">6.5 - 8.5</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">⚠️ Outside = contamination or imbalance</p>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-orange-100 dark:border-orange-900 shadow-sm hover:shadow-md transition-shadow">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">TDS (ppm)</h4>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 mb-3">&lt; 500</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">⚠️ Above = too many dissolved solids</p>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-yellow-100 dark:border-yellow-900 shadow-sm hover:shadow-md transition-shadow">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Turbidity (NTU)</h4>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mb-3">&lt; 5.0</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">⚠️ High = sediment detected</p>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-green-100 dark:border-green-900 shadow-sm hover:shadow-md transition-shadow">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Temperature (°C)</h4>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400 mb-3">10 - 25</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">⚠️ Outside = microbial risk</p>
              </div>

              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-cyan-100 dark:border-cyan-900 shadow-sm hover:shadow-md transition-shadow">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Conductivity (&micro;S/cm)</h4>
                <p className="text-2xl font-bold text-cyan-600 dark:text-cyan-400 mb-3">&lt; 1000</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">⚠️ Mineral content indicator</p>
              </div>
            </div>

            <div className="mt-6 p-4 bg-red-100 dark:bg-red-900/50 border border-red-300 dark:border-red-700 rounded-lg">
              <p className="text-xs font-semibold text-red-900 dark:text-red-100">
                🚨 <span className="ml-2">Schedule:</span> Daily checks • Weekly connections review • Monthly sensor cleaning • Quarterly calibration
              </p>
            </div>
          </div>
        )}
      </div>
      {showFilters && (
        <div className="mb-6 rounded-lg border-2 border-blue-300 dark:border-blue-700 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 p-6 shadow-lg">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">⚙️ Advanced Filters</h3>
            <button onClick={() => setShowFilters(false)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Time Presets */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">⏰ Quick Time Range</label>
            <div className="grid gap-2 lg:grid-cols-5">
              {[
                { value: 'all', label: 'All Data' },
                { value: '24h', label: 'Last 24h' },
                { value: '7d', label: 'Last 7 Days' },
                { value: '30d', label: 'Last 30 Days' },
              ].map(preset => (
                <button
                  key={preset.value}
                  onClick={() => setTimePreset(preset.value)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    timePreset === preset.value
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Granularity */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">📊 Data Granularity</label>
            <div className="grid gap-2 lg:grid-cols-3">
              {[
                { value: 'detailed', label: 'Detailed (~100 pts)', icon: '📌' },
                { value: 'hourly', label: 'Hourly (~24 pts)', icon: '🕐' },
                { value: 'daily', label: 'Daily (~7 pts)', icon: '📅' },
              ].map(option => (
                <button
                  key={option.value}
                  onClick={() => setGranularity(option.value)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    granularity === option.value
                      ? 'bg-green-600 text-white shadow-md'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  {option.icon} {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Chart Height */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">📏 Chart Height: {chartHeight}px</label>
            <input
              type="range"
              min="300"
              max="800"
              value={chartHeight}
              onChange={(e) => setChartHeight(parseInt(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mt-1">
              <span>Compact</span>
              <span>Large</span>
            </div>
          </div>

          {/* pH Visibility Boost */}
          <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg border border-purple-300 dark:border-purple-700">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={phBoost}
                onChange={(e) => setPhBoost(e.target.checked)}
                className="w-5 h-5 rounded"
              />
              <span className="text-sm font-semibold text-gray-900 dark:text-white">🔵 Boost pH Visibility</span>
            </label>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 ml-8">Make pH line thicker and brighter</p>
          </div>

          {/* Date Range */}
          <div className="mb-6 pb-6 border-b border-blue-200 dark:border-blue-800">
            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">📅 Custom Date Range</label>
            <div className="grid gap-4 lg:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Start Date</label>
                <input
                  type="datetime-local"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/50 px-3 py-2 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">End Date</label>
                <input
                  type="datetime-local"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/50 px-3 py-2 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Parameter Selection */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3">🔹 Parameters to Display</label>
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
              {[
                { key: 'pH', label: 'pH', color: '#8b5cf6' },
                { key: 'tds', label: 'TDS', color: '#3b82f6' },
                { key: 'temperature', label: 'Temperature', color: '#f97316' },
                { key: 'turbidity', label: 'Turbidity', color: '#06b6d4' },
                { key: 'conductivity', label: 'Conductivity', color: '#10b981' },
              ].map(param => (
                <button
                  key={param.key}
                  onClick={() => toggleParam(param.key)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    selectedParams.includes(param.key)
                      ? 'border-blue-600 bg-blue-100 dark:bg-blue-900/50 shadow-md'
                      : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:border-gray-400'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: param.color }}
                    ></div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{param.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => {
                setDateRange({ start: '', end: '' });
                setSelectedParams(['pH', 'tds', 'temperature', 'turbidity', 'conductivity']);
                setTimePreset('all');
                setGranularity('detailed');
                setChartHeight(450);
                setPhBoost(false);
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              🔄 Reset All Filters
            </button>
            <button
              onClick={() => setShowFilters(false)}
              className="ml-auto px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Apply & Close
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      {!reportData.summary ? (
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-8 shadow-sm">
          <p className="text-center text-gray-500 dark:text-gray-400">Loading report data...</p>
        </div>
      ) : (
        <>
          {/* Summary Statistics */}
          <div className="mb-8 grid gap-5 lg:grid-cols-5">
            {reportData.summary && Object.entries(reportData.summary)
              .filter(([key]) => !['data_points', 'time_spent_hours', 'timestamp', 'time_span_hours'].includes(key))
              .map(([key, stats]: [string, any]) => {
              const colors = {
                'pH': { bg: '#a78bfa', light: '#f3e8ff', dark: '#581c87', text: '#6b21a8' },
                'TDS': { bg: '#60a5fa', light: '#dbeafe', dark: '#1e3a8a', text: '#1e40af' },
                'Temperature': { bg: '#fb923c', light: '#fed7aa', dark: '#7c2d12', text: '#92400e' },
                'Turbidity': { bg: '#22d3ee', light: '#cffafe', dark: '#164e63', text: '#0c4a6e' },
                'Conductivity': { bg: '#4ade80', light: '#dcfce7', dark: '#15803d', text: '#166534' },
              };
              const color = colors[key as keyof typeof colors] || colors['Conductivity'];
              return (
                <div key={key} className="rounded-xl border-2 p-5 shadow-lg hover:shadow-xl transition-all hover:scale-105" style={{
                  backgroundColor: color.light,
                  borderColor: color.bg,
                }}>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-bold" style={{ color: color.text }}>{key}</p>
                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{
                      backgroundColor: color.bg + '20',
                      color: color.bg
                    }}>●</div>
                  </div>
                  <p className="text-3xl font-bold" style={{ color: color.bg }}>
                    {typeof stats?.avg === 'number' ? stats.avg.toFixed(2) : 'N/A'}
                  </p>
                  <p className="text-xs font-semibold mt-2" style={{ color: color.text }}>
                    <span className="opacity-70">Min:</span> {typeof stats?.min === 'number' ? stats.min.toFixed(2) : 'N/A'} <span className="opacity-70">| Max:</span> {typeof stats?.max === 'number' ? stats.max.toFixed(2) : 'N/A'}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Safety Metrics */}
          {reportData.alerts && (
            <div className="mb-8 grid gap-5 lg:grid-cols-3">
              <div className="rounded-xl border-2 border-green-200 dark:border-green-900 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900 dark:to-green-800 p-6 shadow-lg hover:shadow-xl transition-all hover:scale-105">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-bold text-green-900 dark:text-green-100">✅ Safety Percentage</p>
                  <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center text-2xl">✓</div>
                </div>
                <p className="text-4xl font-bold text-green-600 dark:text-green-400">
                  {typeof reportData.alerts.safety_percentage === 'number' 
                    ? reportData.alerts.safety_percentage.toFixed(1) 
                    : 0}%
                </p>
                <p className="text-xs text-green-700 dark:text-green-300 mt-3">Target: 95%+</p>
              </div>
              <div className="rounded-xl border-2 border-red-200 dark:border-red-900 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900 dark:to-red-800 p-6 shadow-lg hover:shadow-xl transition-all hover:scale-105">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-bold text-red-900 dark:text-red-100">⚠️ Unsafe Readings</p>
                  <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center text-2xl">!</div>
                </div>
                <p className="text-4xl font-bold text-red-600 dark:text-red-400">
                  {reportData.alerts.total_unsafe_readings || 0}
                </p>
                <p className="text-xs text-red-700 dark:text-red-300 mt-3">Needs review</p>
              </div>
              <div className="rounded-xl border-2 border-blue-200 dark:border-blue-900 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 p-6 shadow-lg hover:shadow-xl transition-all hover:scale-105">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-bold text-blue-900 dark:text-blue-100">📊 Total Readings</p>
                  <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center text-2xl">📈</div>
                </div>
                <p className="text-4xl font-bold text-blue-600 dark:text-blue-400">
                  {reportData.data?.length || 0}
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-3">Analyzed</p>
              </div>
            </div>
          )}

          {/* Report Type Specific Metrics */}
          {renderReportSpecificMetrics()}

          {/* Chart */}
          {filteredData.length > 0 && (
            <div className="mt-8 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 p-8 shadow-xl hover:shadow-2xl transition-shadow">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold mb-1 text-gray-900 dark:text-white">
                    {chartType === 'area' ? '📊' : chartType === 'bar' ? '📉' : chartType === 'scatter' ? '🔵' : chartType === 'panels' ? '☰' : '📈'} {chartType.charAt(0).toUpperCase() + chartType.slice(1)} Analysis
                  </h2>
                </div>
              </div>

              {/* Chart Parameter Filter */}
              <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                <p className="text-sm font-semibold text-gray-900 dark:text-white mb-3">📊 Display Parameters:</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { key: 'pH', label: '🔵 pH', color: '#a78bfa' },
                    { key: 'tds', label: '🌊 TDS', color: '#60a5fa' },
                    { key: 'temperature', label: '🌡️ Temperature', color: '#fb923c' },
                    { key: 'turbidity', label: '💧 Turbidity', color: '#22d3ee' },
                    { key: 'conductivity', label: '⚡ Conductivity', color: '#4ade80' },
                  ].map(param => (
                    <button
                      key={param.key}
                      onClick={() => toggleParam(param.key)}
                      className={`px-4 py-2 rounded-lg font-medium transition-all text-sm ${
                        selectedParams.includes(param.key)
                          ? 'bg-blue-600 text-white shadow-md border border-blue-700'
                          : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:border-gray-400'
                      }`}
                      style={selectedParams.includes(param.key) ? { boxShadow: `0 0 12px ${param.color}40` } : {}}
                    >
                      {param.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                {renderChart()}
              </div>
            </div>
          )}
        </>
      )}
    </Layout>
  );
}
