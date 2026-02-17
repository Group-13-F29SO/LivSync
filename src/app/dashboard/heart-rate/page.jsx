'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar/Navbar';
import { useAuth } from '@/hooks/useAuth';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';

export default function HeartRateChartPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [chartData, setChartData] = useState([]);
  const [stats, setStats] = useState(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    const fetchHeartRateData = async () => {
      try {
        setDataLoading(true);
        const response = await fetch('/api/biometrics/heart-rate');
        
        if (!response.ok) {
          throw new Error('Failed to fetch heart rate data');
        }

        const result = await response.json();
        setChartData(result.data);
        setStats(result.stats);
      } catch (err) {
        console.error('Error fetching heart rate data:', err);
        setError(err.message);
      } finally {
        setDataLoading(false);
      }
    };

    if (user) {
      fetchHeartRateData();
    }
  }, [user]);

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
      <main className="flex-1 p-8 ml-20 overflow-auto bg-blue-50 dark:bg-gray-950 text-gray-900 dark:text-gray-50">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="inline-block text-3xl font-bold bg-gradient-to-br from-blue-600 via-purple-500 to-pink-400 bg-clip-text text-transparent">
              Heart Rate Monitor
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Track your heart rate trends over time
            </p>
          </div>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-gray-300 hover:bg-gray-400 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium rounded-lg transition-colors"
          >
            Back
          </button>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Current Average</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">{stats.average}</p>
              <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">bpm</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Maximum</p>
              <p className="text-3xl font-bold text-red-600 mt-2">{stats.max}</p>
              <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">bpm</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Minimum</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{stats.min}</p>
              <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">bpm</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Data Points</p>
              <p className="text-3xl font-bold text-purple-600 mt-2">{stats.count}</p>
              <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">readings</p>
            </div>
          </div>
        )}

        {/* Chart Section */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
          {error ? (
            <div className="text-red-600 dark:text-red-400 p-4 bg-red-50 dark:bg-red-900/20 rounded">
              Error: {error}
            </div>
          ) : dataLoading ? (
            <div className="flex items-center justify-center h-96">
              <p className="text-gray-600 dark:text-gray-400">Loading heart rate data...</p>
            </div>
          ) : chartData.length === 0 ? (
            <div className="flex items-center justify-center h-96">
              <p className="text-gray-600 dark:text-gray-400">No heart rate data available yet.</p>
            </div>
          ) : (
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
                Heart Rate Over Time
              </h2>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart
                  data={chartData}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    stroke="#e5e7eb"
                    dark="#374151"
                  />
                  <XAxis 
                    dataKey="timestamp" 
                    stroke="#6b7280"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis 
                    stroke="#6b7280"
                    style={{ fontSize: '12px' }}
                    label={{ value: 'BPM', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: '1px solid #3b82f6',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                    formatter={(value) => [`${value} bpm`, 'Heart Rate']}
                  />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorValue)"
                    name="Heart Rate (bpm)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Additional Info */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg">
          <h3 className="font-semibold text-blue-900 dark:text-blue-200">Heart Rate Information</h3>
          <ul className="mt-2 text-sm text-blue-800 dark:text-blue-300 space-y-1">
            <li>• <strong>Resting Heart Rate:</strong> 60-100 bpm is considered normal</li>
            <li>• <strong>Athletic Heart Rate:</strong> 40-60 bpm indicates good cardiovascular fitness</li>
            <li>• <strong>Maximum Heart Rate:</strong> Estimated at 220 minus your age</li>
            <li>• <strong>Target Zone:</strong> 50-85% of maximum heart rate for moderate to vigorous exercise</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
