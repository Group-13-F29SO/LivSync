'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar/Navbar';
import { useAuth } from '@/hooks/useAuth';
import { PrimaryButton, SecondaryButton } from '@/components/Settings/Buttons';

const BIOMARKER_DEFAULTS = {
  heart_rate: { label: 'Heart Rate (bpm)', min: 60, max: 100, step: 1 },
  blood_glucose: { label: 'Blood Glucose (mg/dL)', min: 70, max: 130, step: 1 },
  steps: { label: 'Steps (daily)', min: 5000, max: 20000, step: 100 },
  sleep: { label: 'Sleep (hours)', min: 6, max: 10, step: 0.5 },
  calories: { label: 'Calories Burned (kcal)', min: 1500, max: 3000, step: 50 },
  hydration: { label: 'Hydration (glasses)', min: 6, max: 12, step: 1 },
};

export default function AlertThresholdsPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [thresholds, setThresholds] = useState({});
  const [isLoadingThresholds, setIsLoadingThresholds] = useState(true);
  const [thresholdError, setThresholdError] = useState(null);
  const [thresholdSuccess, setThresholdSuccess] = useState(null);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
    if (!isLoading && user && user.userType === 'provider') {
      router.push('/provider');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (!isLoading && user && user.id && user.userType === 'patient') {
      fetchThresholds();
    }
  }, [user, isLoading]);

  const fetchThresholds = async () => {
    try {
      setIsLoadingThresholds(true);
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
        setThresholdError(null);
      }
    } catch (err) {
      console.error('Failed to fetch thresholds:', err);
      setThresholdError('Failed to load alert thresholds');
    } finally {
      setIsLoadingThresholds(false);
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
    setThresholdSuccess(null);
  };

  const handleSaveThresholds = async () => {
    try {
      setThresholdError(null);
      setThresholdSuccess(null);
      setIsLoadingThresholds(true);

      // Validate all thresholds before saving
      for (const [metricType, values] of Object.entries(thresholds)) {
        if (values.min >= values.max) {
          setThresholdError(`${BIOMARKER_DEFAULTS[metricType].label}: Minimum must be less than maximum`);
          setIsLoadingThresholds(false);
          return;
        }
      }

      // Save each threshold
      const savePromises = Object.entries(thresholds).map(async ([metricType, values]) => {
        const response = await fetch('/api/patient/alert-thresholds', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            metricType,
            minValue: values.min,
            maxValue: values.max,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || `Failed to save ${metricType}`);
        }

        return data;
      });

      const results = await Promise.all(savePromises);

      if (results && results.length > 0) {
        setThresholdSuccess('Alert thresholds saved successfully');
      } else {
        setThresholdError('No thresholds were saved');
      }
    } catch (err) {
      console.error('Error saving thresholds:', err);
      setThresholdError(err.message || 'Failed to save alert thresholds. Please try again.');
    } finally {
      setIsLoadingThresholds(false);
    }
  };

  const BackIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  );

  return (
    <div className="min-h-screen flex bg-white dark:bg-gray-950">
      {/* Navbar */}
      <Navbar />

      {/* Main Content */}
      <main className="flex-1 ml-20 overflow-auto bg-blue-50 dark:bg-gray-950 text-gray-900 dark:text-gray-50">
        <div className="p-8 max-w-4xl">
          {/* Page Header with Back Button */}
          <div className="mb-8">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mb-4 transition-colors"
            >
              <BackIcon />
              <span className="font-medium">Back to Settings</span>
            </button>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2 pb-1">
              Alert Thresholds
            </h1>
            <p className="text-slate-500 dark:text-slate-400">Configure custom alert thresholds for your biomarkers</p>
          </div>

          {/* Alert Thresholds Content */}
          <div className="p-6 bg-white dark:bg-gray-900 rounded-lg border border-slate-200 dark:border-gray-800 shadow-sm">
            <p className="text-slate-600 dark:text-slate-400 mb-6 text-sm">
              Set custom alert thresholds for your biomarkers. You'll receive notifications when your readings fall outside these ranges.
            </p>

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
                          disabled={isLoadingThresholds}
                          className="w-full px-3 py-2 bg-white dark:bg-gray-700 rounded-lg text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
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
                          disabled={isLoadingThresholds}
                          className="w-full px-3 py-2 bg-white dark:bg-gray-700 rounded-lg text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
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

              {/* Error and Success Messages */}
              {thresholdError && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
                  <p className="font-medium">Error</p>
                  <p>{thresholdError}</p>
                </div>
              )}
              {thresholdSuccess && (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-600 dark:text-green-400 text-sm">
                  <p className="font-medium">Success</p>
                  <p>{thresholdSuccess}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-6 border-t border-slate-200 dark:border-gray-700">
                <PrimaryButton onClick={handleSaveThresholds} disabled={isLoadingThresholds}>
                  {isLoadingThresholds ? 'Saving...' : 'Save Thresholds'}
                </PrimaryButton>
                <SecondaryButton onClick={() => router.back()}>
                  Cancel
                </SecondaryButton>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
