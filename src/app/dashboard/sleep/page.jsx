'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar/Navbar';
import { useAuth } from '@/hooks/useAuth';
import {
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';

export default function SleepChartPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [chartData, setChartData] = useState([]);
  const [stats, setStats] = useState(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState(null);

  const RECOMMENDED_MIN = 7;
  const RECOMMENDED_MAX = 9;

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    const fetchSleepData = async () => {
      try {
        setDataLoading(true);
        const response = await fetch(`/api/biometrics/sleep?date=${selectedDate}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch sleep data');
        }

        const result = await response.json();
        setChartData(result.data);
        setStats(result.stats);
      } catch (err) {
        console.error('Error fetching sleep data:', err);
        setError(err.message);
      } finally {
        setDataLoading(false);
      }
    };

    if (user) {
      fetchSleepData();
    }
  }, [user, selectedDate]);

  // Get radial chart data for current progress
  const getRadialData = () => {
    if (!stats) return [];
    
    const progress = stats.currentProgress || 0;
    
    return [
      {
        name: 'Progress',
        value: progress,
        fill: progress >= 100 ? '#10b981' : progress >= 85 ? '#3b82f6' : progress >= 70 ? '#f59e0b' : '#ef4444'
      }
    ];
  };

  // Get quality label and color based on sleep hours
  const getSleepQuality = (hours) => {
    if (hours < 5) return { color: '#ef4444', label: 'Critical' };
    if (hours < 6) return { color: '#f97316', label: 'Insufficient' };
    if (hours < 7) return { color: '#f59e0b', label: 'Below Optimal' };
    if (hours >= 7 && hours <= 9) return { color: '#10b981', label: 'Optimal' };
    if (hours > 9 && hours <= 10) return { color: '#3b82f6', label: 'Extended' };
    return { color: '#6366f1', label: 'Oversleep' };
  };

  // Get bar color based on sleep hours
  const getBarColor = (value) => {
    return getSleepQuality(value).color;
  };

  // Handle delete sleep data
  const handleDeleteData = async () => {
    if (!confirm(`Are you sure you want to delete sleep data for ${selectedDate}? This action cannot be undone.`)) {
      return;
    }

    try {
      setActionLoading(true);
      setActionMessage(null);
      
      const response = await fetch('/api/biometrics/sleep/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: selectedDate })
      });

      if (!response.ok) {
        throw new Error('Failed to delete sleep data');
      }

      const result = await response.json();
      setActionMessage({ type: 'success', text: result.message });
      
      // Refresh the data
      await new Promise(resolve => setTimeout(resolve, 500));
      const refreshResponse = await fetch(`/api/biometrics/sleep?date=${selectedDate}`);
      const refreshResult = await refreshResponse.json();
      setChartData(refreshResult.data);
      setStats(refreshResult.stats);
    } catch (err) {
      setActionMessage({ type: 'error', text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  // Handle generate sleep data
  const handleGenerateData = async () => {
    try {
      setActionLoading(true);
      setActionMessage(null);
      
      const response = await fetch('/api/biometrics/sleep/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: selectedDate })
      });

      if (!response.ok) {
        throw new Error('Failed to generate sleep data');
      }

      const result = await response.json();
      setActionMessage({ type: 'success', text: result.message });
      
      // Refresh the data
      await new Promise(resolve => setTimeout(resolve, 500));
      const refreshResponse = await fetch(`/api/biometrics/sleep?date=${selectedDate}`);
      const refreshResult = await refreshResponse.json();
      setChartData(refreshResult.data);
      setStats(refreshResult.stats);
    } catch (err) {
      setActionMessage({ type: 'error', text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950">
        <p className="text-gray-600 dark:text-gray-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-white dark:bg-gray-950">
      <Navbar />

      {/* Main Content Area */}
      <main className="flex-1 p-8 ml-20 overflow-auto bg-purple-50 dark:bg-gray-950 text-gray-900 dark:text-gray-50">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="inline-block text-3xl font-bold bg-gradient-to-br from-purple-600 via-indigo-500 to-blue-400 bg-clip-text text-transparent">
              Sleep Tracker
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              {selectedDate === new Date().toISOString().split('T')[0] 
                ? 'Monitor your sleep patterns and quality' 
                : `Viewing sleep data for ${new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`}
            </p>
          </div>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-gray-300 hover:bg-gray-400 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium rounded-lg transition-colors"
          >
            Back
          </button>
        </div>

        {/* Date Picker */}
        <div className="flex flex-col gap-2 mb-8">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Select Date:</label>
          <div className="flex gap-3 items-end">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              onClick={handleDeleteData}
              disabled={actionLoading}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 disabled:bg-red-300 dark:bg-red-600 dark:hover:bg-red-700 dark:disabled:bg-red-800 text-white font-medium rounded-lg transition-colors"
            >
              {actionLoading ? 'Processing...' : 'Delete Data'}
            </button>
            <button
              onClick={handleGenerateData}
              disabled={actionLoading}
              className="px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-green-300 dark:bg-green-600 dark:hover:bg-green-700 dark:disabled:bg-green-800 text-white font-medium rounded-lg transition-colors"
            >
              {actionLoading ? 'Processing...' : 'Generate Data'}
            </button>
          </div>
        </div>

        {/* Action Message */}
        {actionMessage && (
          <div className={`mb-6 p-4 rounded-lg ${
            actionMessage.type === 'success' 
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400' 
              : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400'
          }`}>
            {actionMessage.text}
          </div>
        )}

        {/* Statistics Cards */}
        {stats && stats.latest > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Last Night's Sleep</p>
              <p className={`text-3xl font-bold mt-2`} style={{ color: getSleepQuality(stats.latest).color }}>
                {stats.latest}h
              </p>
              <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">
                {getSleepQuality(stats.latest).label}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Average Sleep</p>
              <p className="text-3xl font-bold text-purple-600 mt-2">
                {stats.average}h
              </p>
              <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">
                {stats.count} nights tracked
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Best Sleep</p>
              <p className="text-3xl font-bold text-green-600 mt-2">
                {stats.max}h
              </p>
              <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">longest night</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Sleep Quality</p>
              <p className="text-3xl font-bold text-indigo-600 mt-2">
                {stats.optimalPercentage}%
              </p>
              <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">
                {stats.optimalNights}/{stats.count} optimal
              </p>
            </div>
          </div>
        )}

        {/* Radial Progress Chart & History */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Current Progress - Radial Chart */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
            {error ? (
              <div className="text-red-600 dark:text-red-400 p-4 bg-red-50 dark:bg-red-900/20 rounded">
                Error: {error}
              </div>
            ) : dataLoading ? (
              <div className="flex items-center justify-center h-96">
                <p className="text-gray-600 dark:text-gray-400">Loading sleep data...</p>
              </div>
            ) : !stats ? (
              <div className="flex items-center justify-center h-96">
                <p className="text-gray-600 dark:text-gray-400">No sleep data available yet.</p>
              </div>
            ) : stats.latest === 0 ? (
              <div className="flex items-center justify-center h-96">
                <div className="text-center">
                  <p className="text-gray-600 dark:text-gray-400 text-lg mb-2">No data synced for this date</p>
                  <p className="text-gray-500 dark:text-gray-500 text-sm">Data will appear here once your device syncs sleep information</p>
                </div>
              </div>
            ) : (
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
                  {selectedDate === new Date().toISOString().split('T')[0] ? "Last Night's Sleep" : 'Selected Date Sleep'}
                </h2>
                <ResponsiveContainer width="100%" height={300}>
                  <RadialBarChart
                    cx="50%"
                    cy="50%"
                    innerRadius="60%"
                    outerRadius="90%"
                    data={getRadialData()}
                    startAngle={90}
                    endAngle={-270}
                  >
                    <PolarAngleAxis
                      type="number"
                      domain={[0, 100]}
                      angleAxisId={0}
                      tick={false}
                    />
                    <RadialBar
                      background
                      dataKey="value"
                      cornerRadius={10}
                      fill={getRadialData()[0]?.fill}
                    />
                    <text
                      x="50%"
                      y="45%"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="text-5xl font-bold fill-gray-900 dark:fill-gray-100"
                    >
                      {stats.latest}
                    </text>
                    <text
                      x="50%"
                      y="55%"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="text-lg fill-gray-600 dark:fill-gray-400"
                    >
                      of {stats.recommendedMax}h goal
                    </text>
                  </RadialBarChart>
                </ResponsiveContainer>
                <div className="text-center mt-4">
                  <p className="text-2xl font-bold" style={{ color: getRadialData()[0]?.fill }}>
                    {stats.currentProgress}%
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {stats.latest >= RECOMMENDED_MIN 
                      ? '✨ Good sleep!' 
                      : `${(RECOMMENDED_MIN - stats.latest).toFixed(1)}h short of optimal`
                    }
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Sleep Tips */}
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 p-6 rounded-lg shadow-lg border border-purple-200 dark:border-purple-800">
            <h3 className="text-lg font-bold text-purple-900 dark:text-purple-200 mb-4">😴 Sleep Tips</h3>
            <div className="space-y-4 text-sm">
              <div className="flex items-start gap-3">
                <span className="text-lg">🕐</span>
                <div>
                  <p className="font-semibold text-purple-900 dark:text-purple-200">Consistent Schedule</p>
                  <p className="text-purple-800 dark:text-purple-300">Go to bed and wake up at the same time daily</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-lg">🌡️</span>
                <div>
                  <p className="font-semibold text-purple-900 dark:text-purple-200">Cool Environment</p>
                  <p className="text-purple-800 dark:text-purple-300">Keep bedroom temperature between 60-67°F</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-lg">📱</span>
                <div>
                  <p className="font-semibold text-purple-900 dark:text-purple-200">Limit Screen Time</p>
                  <p className="text-purple-800 dark:text-purple-300">Avoid screens 1 hour before bedtime</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-lg">☕</span>
                <div>
                  <p className="font-semibold text-purple-900 dark:text-purple-200">Avoid Caffeine</p>
                  <p className="text-purple-800 dark:text-purple-300">No caffeine 6 hours before sleep</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sleep History Chart */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg mb-8">
          {chartData.length > 0 ? (
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
                Sleep History (Last 14 Days)
              </h2>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart
                  data={chartData}
                  margin={{ top: 10, right: 30, left: 0, bottom: 5 }}
                >
                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    stroke="#e5e7eb"
                    vertical={false}
                  />
                  <XAxis 
                    dataKey="date"
                    stroke="#6b7280"
                    style={{ fontSize: '12px' }}
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis 
                    stroke="#6b7280"
                    style={{ fontSize: '12px' }}
                    label={{ value: 'Hours', angle: -90, position: 'insideLeft' }}
                    domain={[0, 12]}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: '2px solid #6366f1',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                    formatter={(value) => [`${value}h`, 'Sleep']}
                    labelFormatter={(label) => `Date: ${label}`}
                  />
                  <Bar 
                    dataKey="value" 
                    name="Sleep Duration"
                    radius={[8, 8, 0, 0]}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getBarColor(entry.value)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              
              {/* Legend */}
              <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded"></div>
                  <span className="text-gray-600 dark:text-gray-400">Optimal (7-9h)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded"></div>
                  <span className="text-gray-600 dark:text-gray-400">Extended (9-10h)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-orange-600 rounded"></div>
                  <span className="text-gray-600 dark:text-gray-400">Below Optimal (6-7h)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-orange-500 rounded"></div>
                  <span className="text-gray-600 dark:text-gray-400">Insufficient (5-6h)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded"></div>
                  <span className="text-gray-600 dark:text-gray-400">Critical (&lt;5h)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-indigo-500 rounded"></div>
                  <span className="text-gray-600 dark:text-gray-400">Oversleep (&gt;10h)</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-96">
              <p className="text-gray-600 dark:text-gray-400">No sleep history available yet.</p>
            </div>
          )}
        </div>

        {/* Sleep Quality Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 p-6 rounded-lg">
            <h3 className="font-semibold text-green-900 dark:text-green-200 text-lg mb-3">💚 Sleep Benefits</h3>
            <ul className="space-y-2 text-sm text-green-800 dark:text-green-300">
              <li>• <strong>Memory & Learning:</strong> Consolidates memories and improves focus</li>
              <li>• <strong>Physical Health:</strong> Repairs tissues and strengthens immune system</li>
              <li>• <strong>Emotional Balance:</strong> Regulates mood and reduces stress</li>
              <li>• <strong>Metabolism:</strong> Helps maintain healthy weight and blood sugar</li>
            </ul>
          </div>

          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-200 dark:border-indigo-800 p-6 rounded-lg">
            <h3 className="font-semibold text-indigo-900 dark:text-indigo-200 text-lg mb-3">📊 Sleep Guidelines</h3>
            <ul className="space-y-2 text-sm text-indigo-800 dark:text-indigo-300">
              <li>• <strong>Adults (18-64):</strong> 7-9 hours recommended per night</li>
              <li>• <strong>Quality matters:</strong> Uninterrupted sleep is more restorative</li>
              <li>• <strong>Sleep cycles:</strong> About 90 minutes per cycle; 5-6 cycles optimal</li>
              <li>• <strong>Individual needs:</strong> Some need more or less than average</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
