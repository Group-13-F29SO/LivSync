'use client';

import { useState, useEffect } from 'react';

const BIOMARKER_DEFAULTS = {
  heart_rate: { label: 'Heart Rate (bpm)', min: 60, max: 100, step: 1 },
  blood_glucose: { label: 'Blood Glucose (mg/dL)', min: 70, max: 130, step: 1 },
  steps: { label: 'Steps (daily)', min: 5000, max: 20000, step: 100 },
  sleep: { label: 'Sleep (hours)', min: 6, max: 10, step: 0.5 },
  calories: { label: 'Calories Burned (kcal)', min: 1500, max: 3000, step: 50 },
  hydration: { label: 'Hydration (glasses)', min: 6, max: 12, step: 1 },
};

export default function AlertThresholdSection() {
  const [thresholds, setThresholds] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchThresholds();
  }, []);

  const fetchThresholds = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/patient/alert-thresholds');
      const json = await res.json();

      if (json.success) {
        // Create a map of thresholds by metric type
        const thresholdMap = {};
        json.data.forEach((t) => {
          thresholdMap[t.metricType] = {
            min: t.minValue,
            max: t.maxValue,
          };
        });

        // Initialize with defaults for all biomarkers
        const allThresholds = {};
        Object.keys(BIOMARKER_DEFAULTS).forEach((key) => {
          allThresholds[key] = thresholdMap[key] || {
            min: BIOMARKER_DEFAULTS[key].min,
            max: BIOMARKER_DEFAULTS[key].max,
          };
        });

        setThresholds(allThresholds);
      }
    } catch (err) {
      console.error('Failed to fetch thresholds:', err);
      setError('Failed to load alert thresholds');
    } finally {
      setLoading(false);
    }
  };

  const handleThresholdChange = (metric, field, value) => {
    setThresholds((prev) => ({
      ...prev,
      [metric]: {
        ...prev[metric],
        [field]: parseFloat(value),
      },
    }));
  };

  const handleSaveThresholds = async () => {
    try {
      setError(null);
      setSuccess(false);
      setLoading(true);

      // Save each threshold
      const promises = Object.entries(thresholds).map(([metricType, values]) =>
        fetch('/api/patient/alert-thresholds', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            metricType,
            minValue: values.min,
            maxValue: values.max,
          }),
        })
      );

      const responses = await Promise.all(promises);
      const allSuccess = responses.every((r) => r.ok);

      if (allSuccess) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError('Failed to save some thresholds');
      }
    } catch (err) {
      console.error('Error saving thresholds:', err);
      setError('Failed to save alert thresholds');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.entries(BIOMARKER_DEFAULTS).map(([metricType, config]) => (
          <div key={metricType} className="bg-slate-50 dark:bg-gray-800 p-4 rounded-lg border border-slate-200 dark:border-gray-700">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
              {config.label}
            </label>

            <div className="space-y-3">
              <div>
                <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                  Minimum Alert
                </label>
                <input
                  type="number"
                  value={thresholds[metricType]?.min ?? config.min}
                  onChange={(e) => handleThresholdChange(metricType, 'min', e.target.value)}
                  step={config.step}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 rounded-lg text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                  Maximum Alert
                </label>
                <input
                  type="number"
                  value={thresholds[metricType]?.max ?? config.max}
                  onChange={(e) => handleThresholdChange(metricType, 'max', e.target.value)}
                  step={config.step}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 rounded-lg text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900 rounded text-xs text-blue-700 dark:text-blue-200">
                You will receive an alert if your {config.label.toLowerCase()} falls below{' '}
                <span className="font-semibold">{thresholds[metricType]?.min ?? config.min}</span> or exceeds{' '}
                <span className="font-semibold">{thresholds[metricType]?.max ?? config.max}</span>.
              </div>
            </div>
          </div>
        ))}
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg text-red-700 dark:text-red-200 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded-lg text-green-700 dark:text-green-200 text-sm">
          Alert thresholds saved successfully!
        </div>
      )}

      <div className="flex gap-3 pt-4">
        <button
          onClick={handleSaveThresholds}
          disabled={loading}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium rounded-lg transition-colors"
        >
          {loading ? 'Saving...' : 'Save Thresholds'}
        </button>
      </div>
    </div>
  );
}
