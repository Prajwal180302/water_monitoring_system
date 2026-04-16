import { TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react';
import { Layout } from '../components/Layout';
import { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';

export function Prediction() {

  // ✅ INSIDE COMPONENT
  const [prediction, setPrediction] = useState({
    ph: "Stable",
    turbidity: "Stable",
    maintenance: "Normal",
  });

  // ✅ INSIDE COMPONENT
  useEffect(() => {
    const fetchPrediction = async () => {
      try {
        // Fetch latest actual data and the single prediction from REAL APIs
        const [dataRes, predRes] = await Promise.all([
          axiosInstance.get("/data"),
          axiosInstance.get("/predict"),
        ]);

        const records = dataRes.data;
        const pred = predRes.data;

        if (!records || !Array.isArray(records) || records.length === 0) return;
        if (!pred || !pred.prediction_for_next_reading) return;

        // Latest actual reading
        const lastActual = records[records.length - 1];

        const actualPH = Number(lastActual.pH ?? 0);
        const actualTurbidity = Number(lastActual.turbidity ?? 0);

        // Prediction response
        const predPH = Number(pred.prediction_for_next_reading.pH ?? 0);
        const predTurbidity = Number(pred.prediction_for_next_reading.Turbidity ?? 0);
        const predTDS = Number(pred.prediction_for_next_reading.TDS ?? 0);

        let phTrend = "Stable";
        if (predPH > actualPH) phTrend = "Increasing";
        else if (predPH < actualPH) phTrend = "Decreasing";

        let turbidityTrend = "Stable";
        if (predTurbidity > actualTurbidity) turbidityTrend = "Increasing";
        else if (predTurbidity < actualTurbidity) turbidityTrend = "Decreasing";

        let maintenance = "Normal";
        if (predTDS > 500 || predTurbidity > 1.0) {
          maintenance = "Required Soon";
        }

        setPrediction({ ph: phTrend, turbidity: turbidityTrend, maintenance });

      } catch (err) {
        console.error("PREDICTION ERROR:", err);
      }
    };

    fetchPrediction();
    const interval = setInterval(fetchPrediction, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Layout title="Water Quality Predictions" subtitle="AI-powered forecasting and trend analysis">

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">

        {/* pH */}
        <div className="rounded-xl border border-green-200 dark:border-green-900/50 bg-white dark:bg-gray-800 p-6 shadow-md hover:shadow-lg transition-all">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">pH Level Forecast</p>
              <p className="mt-2 text-3xl font-bold text-green-600 dark:text-green-400">
                {prediction.ph}
              </p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </div>

        {/* Turbidity */}
        <div className="rounded-xl border border-blue-200 dark:border-blue-900/50 bg-white dark:bg-gray-800 p-6 shadow-md hover:shadow-lg transition-all">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Turbidity Trend</p>
              <p className="mt-2 text-3xl font-bold text-blue-600 dark:text-blue-400">
                {prediction.turbidity}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        {/* Maintenance */}
        <div className="rounded-xl border border-amber-200 dark:border-amber-900/50 bg-white dark:bg-gray-800 p-6 shadow-md hover:shadow-lg transition-all">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Maintenance</p>
              <p className="mt-2 text-3xl font-bold text-amber-600 dark:text-amber-400">
                {prediction.maintenance}
              </p>
            </div>
            <AlertTriangle className="h-8 w-8 text-amber-500" />
          </div>
        </div>

      </div>

    </Layout>
  );
}