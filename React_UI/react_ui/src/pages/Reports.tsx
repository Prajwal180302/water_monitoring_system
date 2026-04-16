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

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const res = await axiosInstance.get("/reports");
        setReportData(res.data);
        setFilteredData(res.data.data || []);
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

    // Sample data if too many points (for cleaner charts)
    if (filtered.length > 100) {
      const step = Math.ceil(filtered.length / 100);
      filtered = filtered.filter((_, i) => i % step === 0);
    }

    setFilteredData(filtered);
  }, [dateRange, reportData.data]);

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
          description: 'Detailed breakdown of all water quality parameters over time',
          guidance: 'Monitor trends in pH, TDS, turbidity, temperature, and conductivity. Look for sudden spikes or dips that may indicate issues.',
          icon: '💧'
        };
      case 'safety':
        return {
          title: 'Safety & Compliance Report',
          description: 'Safety percentage, violations, and compliance metrics',
          guidance: 'Focuses on safe vs unsafe readings. Safety percentage above 95% is recommended.',
          icon: '🛡️'
        };
      case 'overview':
      default:
        return {
          title: 'System Overview',
          description: 'High-level summary of all metrics and system health',
          guidance: 'Start here for a quick assessment. Check min/max values to identify anomalies.',
          icon: '📊'
        };
    }
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
    const chartData = filteredData.map((item: any, i: number) => ({
      ...item,
      time: i % Math.ceil(filteredData.length / 10) === 0 ? new Date(item.timestamp).toLocaleDateString() : '',
      name: new Date(item.timestamp).toLocaleString(),
    }));

    const commonMargin = { top: 5, right: 30, left: 0, bottom: 40 };

    switch(chartType) {
      case 'area':
        return (
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={chartData} margin={commonMargin}>
              <defs>
                <linearGradient id="colorPH" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="time" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }} />
              <Legend />
              {selectedParams.includes('pH') && <Area type="monotone" dataKey="pH" stackId="1" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorPH)" />}
              {selectedParams.includes('tds') && <Area type="monotone" dataKey="tds" stackId="2" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} />}
              {selectedParams.includes('temperature') && <Area type="monotone" dataKey="temperature" stackId="3" stroke="#f97316" fill="#f97316" fillOpacity={0.2} />}
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={chartData.slice(-30)} margin={commonMargin}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="time" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }} />
              <Legend />
              {selectedParams.includes('pH') && <Bar dataKey="pH" fill="#8b5cf6" />}
              {selectedParams.includes('tds') && <Bar dataKey="tds" fill="#3b82f6" />}
              {selectedParams.includes('temperature') && <Bar dataKey="temperature" fill="#f97316" />}
            </BarChart>
          </ResponsiveContainer>
        );

      case 'scatter':
        return (
          <ResponsiveContainer width="100%" height={350}>
            <ScatterChart data={chartData} margin={{ top: 20, right: 20, bottom: 60, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="pH" name="pH" />
              <YAxis dataKey="temperature" name="Temperature" />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }} />
              <Scatter name="pH vs Temperature" data={chartData} fill="#8b5cf6" />
            </ScatterChart>
          </ResponsiveContainer>
        );

      case 'line':
      default:
        return (
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={chartData} margin={commonMargin}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="time" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }} />
              <Legend />
              {selectedParams.includes('pH') && <Line type="monotone" dataKey="pH" stroke="#8b5cf6" strokeWidth={2} dot={false} />}
              {selectedParams.includes('tds') && <Line type="monotone" dataKey="tds" stroke="#3b82f6" strokeWidth={2} dot={false} />}
              {selectedParams.includes('temperature') && <Line type="monotone" dataKey="temperature" stroke="#f97316" strokeWidth={2} dot={false} />}
              {selectedParams.includes('turbidity') && <Line type="monotone" dataKey="turbidity" stroke="#06b6d4" strokeWidth={2} dot={false} />}
              {selectedParams.includes('conductivity') && <Line type="monotone" dataKey="conductivity" stroke="#10b981" strokeWidth={2} dot={false} />}
            </LineChart>
          </ResponsiveContainer>
        );
      
      case 'panels':
        const paramDefs = [
          { key: 'pH', label: 'pH', color: '#8b5cf6', unit: '' },
          { key: 'tds', label: 'TDS', color: '#3b82f6', unit: 'ppm' },
          { key: 'temperature', label: 'Temperature', color: '#f97316', unit: '°C' },
          { key: 'turbidity', label: 'Turbidity', color: '#06b6d4', unit: 'NTU' },
          { key: 'conductivity', label: 'Conductivity', color: '#10b981', unit: 'µS/cm' },
        ];
        return (
          <div className="grid gap-6 lg:grid-cols-2">
            {paramDefs.filter(p => selectedParams.includes(p.key)).map(param => (
              <div key={param.key} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-900">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{param.label} {param.unit && `(${param.unit})`}</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="time" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px' }} />
                    <Line type="monotone" dataKey={param.key} stroke={param.color} strokeWidth={2} dot={false} />
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
                    <span className="text-blue-600 font-bold">Overview:</span>
                    <span>High-level system health check with summary statistics for all parameters</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-green-600 font-bold">Water Quality:</span>
                    <span>In-depth analysis of pH, TDS, turbidity, temperature, and conductivity trends</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-red-600 font-bold">Safety Metrics:</span>
                    <span>Compliance report showing safe percentage and any parameter violations</span>
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
            <option value="overview">📊 Overview</option>
            <option value="quality">💧 Water Quality</option>
            <option value="safety">🛡️ Safety Metrics</option>
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
      <div className="mb-6">
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
          <div className="mt-4 rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950 p-6">
            <div className="grid gap-4 lg:grid-cols-5">
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-red-100 dark:border-red-900">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">pH Level</h4>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">6.5 - 8.5</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">⚠️ Outside = contamination or imbalance</p>
              </div>

              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-orange-100 dark:border-orange-900">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">TDS (ppm)</h4>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">&lt; 500</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">⚠️ Above = too many dissolved solids</p>
              </div>

              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-yellow-100 dark:border-yellow-900">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Turbidity (NTU)</h4>
                <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">&lt; 5.0</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">⚠️ High = sediment detected</p>
              </div>

              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-green-100 dark:border-green-900">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Temperature (°C)</h4>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">10 - 25</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">⚠️ Outside = microbial risk</p>
              </div>

              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-cyan-100 dark:border-cyan-900">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Conductivity (&micro;S/cm)</h4>
                <p className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">&lt; 1000</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">⚠️ Mineral content indicator</p>
              </div>
            </div>

            <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/50 border border-red-300 dark:border-red-700 rounded-lg">
              <p className="text-xs font-semibold text-red-900 dark:text-red-100">
                🚨 <span className="ml-2">Schedule:</span> Daily checks • Weekly connections review • Monthly sensor cleaning • Quarterly calibration
              </p>
            </div>
          </div>
        )}

      {/* Filters Panel */}
      {showFilters && (
        <div className="mb-6 rounded-lg border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950 p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Filter Data</h3>
            <button onClick={() => setShowFilters(false)} className="text-gray-500 hover:text-gray-700">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Date Range */}
          <div className="grid gap-4 lg:grid-cols-2 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Start Date</label>
              <input
                type="datetime-local"
                value={dateRange.start}
                onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/50 px-3 py-2 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">End Date</label>
              <input
                type="datetime-local"
                value={dateRange.end}
                onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700/50 px-3 py-2 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          {/* Parameter Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Parameters to Display</label>
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
                  className={`p-3 rounded-lg border-2 transition-colors ${
                    selectedParams.includes(param.key)
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                      : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
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

          <button
            onClick={() => {
              setDateRange({ start: '', end: '' });
              setSelectedParams(['pH', 'tds', 'temperature', 'turbidity', 'conductivity']);
            }}
            className="mt-4 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            Reset Filters
          </button>
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
          <div className="mb-6 grid gap-4 lg:grid-cols-5">
            {reportData.summary && Object.entries(reportData.summary).map(([key, stats]: [string, any]) => (
              <div key={key} className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm hover:shadow-md transition-shadow">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{key}</p>
                <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
                  {typeof stats?.avg === 'number' ? stats.avg.toFixed(2) : 'N/A'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Min: {typeof stats?.min === 'number' ? stats.min.toFixed(2) : 'N/A'} | Max: {typeof stats?.max === 'number' ? stats.max.toFixed(2) : 'N/A'}
                </p>
              </div>
            ))}
          </div>

          {/* Safety Metrics */}
          {reportData.alerts && (
            <div className="mb-6 grid gap-4 lg:grid-cols-3">
              <div className="rounded-lg border border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950 p-6 shadow-sm">
                <p className="text-sm font-medium text-green-700 dark:text-green-300">Safety Percentage</p>
                <p className="mt-2 text-3xl font-bold text-green-600 dark:text-green-400">
                  {typeof reportData.alerts.safety_percentage === 'number' 
                    ? reportData.alerts.safety_percentage.toFixed(1) 
                    : 0}%
                </p>
              </div>
              <div className="rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950 p-6 shadow-sm">
                <p className="text-sm font-medium text-red-700 dark:text-red-300">Unsafe Readings</p>
                <p className="mt-2 text-3xl font-bold text-red-600 dark:text-red-400">
                  {reportData.alerts.total_unsafe_readings || 0}
                </p>
              </div>
              <div className="rounded-lg border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950 p-6 shadow-sm">
                <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Total Readings</p>
                <p className="mt-2 text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {reportData.data?.length || 0}
                </p>
              </div>
            </div>
          )}

          {/* Chart */}
          {filteredData.length > 0 && (
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
              <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">
                {chartType.charAt(0).toUpperCase() + chartType.slice(1)} Analysis ({filteredData.length} data points)
              </h2>
              {renderChart()}
            </div>
          )}
        </>
      )}
      </div>
    </Layout>
  );
}
