import { useState, useEffect } from 'react';
import { Droplet, Thermometer, Gauge, Wind, Zap, CheckCircle, AlertTriangle, Clock, BarChart3, FileText, Settings } from 'lucide-react';
import axiosInstance from '../api/axiosInstance';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useNavigate } from "react-router-dom";

const generateWaterData = () => {
  const data = [];
  for (let i = 0; i < 24; i++) {
    data.push({
      time: `${i}:00`,
      pH: Math.random() * 0.6 + 6.9,
      tds: Math.random() * 50 + 100,
      temperature: Math.random() * 3 + 20,
      turbidity: Math.random() * 0.4 + 0.5,
      conductivity: Math.random() * 100 + 400,
    });
  }
  return data;
};

interface WaterData {
  time: string;
  pH: number;
  tds: number;
  temperature: number;
  turbidity: number;
  conductivity: number;
}

function Dashboard() {

  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  const [metrics, setMetrics] = useState({
    ph: 7.2,
    tds: 125,
    temperature: 21.5,
    turbidity: 0.65,
    conductivity: 450,
  });

  const [currentTime, setCurrentTime] = useState(new Date());

  const [waterData, setWaterData] = useState<WaterData[]>([]);
  const [selectedParams, setSelectedParams] = useState([
    "pH",
    "tds",
    "temperature",
    "turbidity",
    "conductivity",
  ]);

  const parameters = [
    { key: "pH", label: "pH", color: "#8b5cf6" },
    { key: "tds", label: "TDS", color: "#3b82f6" },
    { key: "temperature", label: "Temp", color: "#f97316" },
    { key: "turbidity", label: "Turbidity", color: "#06b6d4" },
    { key: "conductivity", label: "Cond", color: "#10b981" },
  ];

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
          time: new Date(item.timestamp).toLocaleTimeString(),
        }));

        setWaterData(formattedData);

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
        setWaterData(generateWaterData());
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 3000);

    return () => clearInterval(interval);
  }, []);

  const isWaterSafe =
    metrics.ph >= 6.5 &&
    metrics.ph <= 8.5 &&
    metrics.tds <= 500 &&
    metrics.turbidity <= 1.0 &&
    metrics.temperature >= 15 &&
    metrics.temperature <= 25;

  return (
      <div className={`min-h-screen p-6 transition-colors duration-300 ${darkMode ? "dark bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white" : "bg-white text-black"}`}>

      {/* HEADER */}
      <div className="mb-8">
        <div className="mb-2 flex items-center justify-between">
          {/* LEFT - LOGOUT */}
          <button
            onClick={() => {
              localStorage.removeItem("token");
              navigate("/login");
            }}
            className="ml-4 rounded-lg bg-red-500 text-white px-4 py-2 
            shadow-lg hover:bg-red-600 hover:scale-105 transition-all"
          >
            Logout
          </button>

          {/* CENTER - TITLE */}
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
            Water Quality Dashboard
          </h1>

          {/* RIGHT - TIME + DARK MODE */}
          <div className="flex items-center gap-3">
            {/* TIME */}
            <div className="flex items-center gap-2 rounded-lg bg-card/80 px-3 py-1.5 shadow-sm backdrop-blur-sm">
              <Clock className="h-4 w-4 text-gray-500 dark:text-gray-300" />
              <span className="text-sm text-muted-foreground">
                {currentTime.toLocaleTimeString()}
              </span>
            </div>

            {/* DARK MODE BUTTON */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="px-3 py-1.5 rounded-lg 
              bg-gray-800 text-white 
              dark:bg-white dark:text-black 
              shadow hover:scale-105 transition-all"
            >
              {darkMode ? "☀" : "🌙"}
            </button>
          </div>
        </div>

        <p className="text-sm text-muted-foreground">
          Real-time water quality monitoring system
        </p>
      </div>

      {/* NAVIGATION BUTTONS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
        {/* ALERTS */}
        <button
          onClick={() => window.location.href="/alerts"}
          className="flex flex-col items-center justify-center gap-3 
          bg-gradient-to-r from-blue-500 to-blue-600 
          text-white py-6 rounded-2xl 
          shadow-lg hover:shadow-2xl hover:shadow-blue-300
          hover:scale-105 transition-all duration-300
          border border-blue-400/30 backdrop-blur-sm
          hover:brightness-110"
        >
          <div className="bg-white/30 backdrop-blur-sm p-3 rounded-xl">
            <AlertTriangle className="w-8 h-8 text-white drop-shadow-lg" />
          </div>
          <span className="text-lg font-extrabold tracking-wide drop-shadow-md">
            Alerts
          </span>
        </button>

        {/* PREDICTION */}
        <button
          onClick={() => window.location.href="/prediction"}
          className="flex flex-col items-center justify-center gap-3 
          bg-gradient-to-r from-green-500 to-emerald-600 
          text-white py-6 rounded-2xl 
          shadow-lg hover:shadow-2xl hover:shadow-green-300
          hover:scale-105 transition-all duration-300
          border border-green-400/30 backdrop-blur-sm
          hover:brightness-110"
        >
          <div className="bg-white/30 backdrop-blur-sm p-3 rounded-xl">
            <BarChart3 className="w-8 h-8 text-white drop-shadow-lg" />
          </div>
          <span className="text-lg font-extrabold tracking-wide drop-shadow-md">
            Prediction
          </span>
        </button>

        {/* REPORTS */}
        <button
          onClick={() => window.location.href="/reports"}
          className="flex flex-col items-center justify-center gap-3 
          bg-gradient-to-r from-purple-500 to-pink-500 
          text-white py-6 rounded-2xl 
          shadow-lg hover:shadow-2xl hover:shadow-purple-300
          hover:scale-105 transition-all duration-300
          border border-purple-400/30 backdrop-blur-sm
          hover:brightness-110"
        >
          <div className="bg-white/30 backdrop-blur-sm p-3 rounded-xl">
            <FileText className="w-8 h-8 text-white drop-shadow-lg" />
          </div>
          <span className="text-lg font-extrabold tracking-wide drop-shadow-md">
            Reports
          </span>
        </button>

        {/* SETTINGS */}
        <button
          onClick={() => window.location.href="/settings"}
          className="flex flex-col items-center justify-center gap-3 
          bg-gradient-to-r from-gray-500 to-gray-700 
          text-white py-6 rounded-2xl 
          shadow-lg hover:shadow-2xl hover:shadow-gray-400
          hover:scale-105 transition-all duration-300
          border border-gray-400/30 backdrop-blur-sm
          hover:brightness-110"
        >
          <div className="bg-white/30 backdrop-blur-sm p-3 rounded-xl">
            <Settings className="w-8 h-8 text-white drop-shadow-lg" />
          </div>
          <span className="text-lg font-extrabold tracking-wide drop-shadow-md">
            Settings
          </span>
        </button>
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
                Water Status: {isWaterSafe ? 'SAFE' : 'UNSAFE'}
              </h2>
              <p className={`text-sm font-bold ${
                isWaterSafe
                  ? 'text-green-900 dark:text-green-100'
                  : 'text-red-900 dark:text-red-100'
              }`}>
                {isWaterSafe ? 'All parameters normal' : 'Check water quality immediately!'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* METRICS CARDS */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {/* pH */}
        <div className="group rounded-2xl border border-gray-200 dark:border-gray-700 
        bg-white dark:bg-gray-800/80 backdrop-blur-md 
        p-5 shadow-lg hover:shadow-2xl 
        transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between h-full">
          <div className="p-3 rounded-xl bg-purple-100 dark:bg-purple-900/30 w-fit mb-4">
            <Zap className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-300 mb-2">pH</p>
            <h2 className="text-xl font-bold text-black dark:text-white">{metrics.ph}</h2>
          </div>
        </div>

        {/* TDS */}
        <div className="group rounded-2xl border border-gray-200 dark:border-gray-700 
        bg-white dark:bg-gray-800/80 backdrop-blur-md 
        p-5 shadow-lg hover:shadow-2xl 
        transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between h-full">
          <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/30 w-fit mb-4">
            <Droplet className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-300 mb-2">TDS</p>
            <h2 className="text-xl font-bold text-black dark:text-white">{metrics.tds}</h2>
          </div>
        </div>

        {/* Temperature */}
        <div className="group rounded-2xl border border-gray-200 dark:border-gray-700 
        bg-white dark:bg-gray-800/80 backdrop-blur-md 
        p-5 shadow-lg hover:shadow-2xl 
        transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between h-full">
          <div className="p-3 rounded-xl bg-orange-100 dark:bg-orange-900/30 w-fit mb-4">
            <Thermometer className="w-6 h-6 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-300 mb-2">Temperature</p>
            <h2 className="text-xl font-bold text-black dark:text-white">{metrics.temperature}</h2>
          </div>
        </div>

        {/* Turbidity */}
        <div className="group rounded-2xl border border-gray-200 dark:border-gray-700 
        bg-white dark:bg-gray-800/80 backdrop-blur-md 
        p-5 shadow-lg hover:shadow-2xl 
        transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between h-full">
          <div className="p-3 rounded-xl bg-cyan-100 dark:bg-cyan-900/30 w-fit mb-4">
            <Wind className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-300 mb-2">Turbidity</p>
            <h2 className="text-xl font-bold text-black dark:text-white">{metrics.turbidity}</h2>
          </div>
        </div>

        {/* Conductivity */}
        <div className="group rounded-2xl border border-gray-200 dark:border-gray-700 
        bg-white dark:bg-gray-800/80 backdrop-blur-md 
        p-5 shadow-lg hover:shadow-2xl 
        transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between h-full">
          <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 w-fit mb-4">
            <Gauge className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-300 mb-2">Conductivity</p>
            <h2 className="text-xl font-bold text-black dark:text-white">{metrics.conductivity}</h2>
          </div>
        </div>
      </div>

      {/* CHART */}
      <div className="bg-white dark:bg-gray-800/80 
      backdrop-blur-md border border-gray-200 dark:border-gray-700 
      rounded-2xl shadow-lg p-6 mt-6">
        <h2 className="text-lg font-semibold mb-4 text-black dark:text-white">
          Water Quality Trends
        </h2>

        <div className="mb-4 p-4 rounded-xl bg-gray-100 dark:bg-gray-800 shadow-sm">

  <div className="flex justify-between items-center mb-3">
    <h3 className="font-semibold text-gray-700 dark:text-gray-200">
      Filter Parameters
    </h3>

    <div className="flex gap-2">
      <button
        onClick={() => setSelectedParams(parameters.map(p => p.key))}
        className="text-xs px-3 py-1 bg-green-500 text-white rounded-md"
      >
        Select All
      </button>

      <button
        onClick={() => setSelectedParams([])}
        className="text-xs px-3 py-1 bg-red-500 text-white rounded-md"
      >
        Clear
      </button>
    </div>
  </div>

  <div className="flex flex-wrap gap-2">
    {parameters.map((param) => {
      const active = selectedParams.includes(param.key);

      return (
        <button
          key={param.key}
          onClick={() => {
            if (active) {
              setSelectedParams(selectedParams.filter(p => p !== param.key));
            } else {
              setSelectedParams([...selectedParams, param.key]);
            }
          }}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all
            ${
              active
                ? "text-white shadow-lg"
                : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
            }`}
          style={{
            backgroundColor: active ? param.color : undefined,
          }}
        >
          {param.label}
        </button>
      );
    })}
  </div>
</div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={waterData}>
            <XAxis dataKey="time" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip />
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
      </div>
    </div>
  );
}

export default Dashboard;