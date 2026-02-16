'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar/Navbar';
import { useAuth } from '@/hooks/useAuth';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
  Area,
  ComposedChart
} from 'recharts';

export default function SleepChartPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [chartData, setChartData] = useState([]);
  const [stats, setStats] = useState(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState(null);

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
        const response = await fetch('/api/biometrics/sleep');
        
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
  }, [user]);

  // Get bar color and quality label based on sleep hours
  const getSleepQuality = (hours) => {
    if (hours < 5) return { color: '#ef4444', quality: 'Poor', label: 'Critical' };
    if (hours < 6) return { color: '#f97316', quality: 'Low', label: 'Insufficient' };
    if (hours < 7) return { color: '#f59e0b', quality: 'Fair', label: 'Below Optimal' };
    if (hours >= 7 && hours <= 9) return { color: '#10b981', quality: 'Good', label: 'Optimal' };
    if (hours > 9 && hours <= 10) return { color: '#3b82f6', quality: 'Good', label: 'Extended' };
    return { color: '#6366f1', quality: 'Fair', label: 'Oversleep' };
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
      <main className="flex-1 p-8 ml-20 overflow-auto bg-blue-50 dark:bg-gray-950 text-gray-900 dark:text-gray-50">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="inline-block text-3xl font-bold bg-gradient-to-br from-indigo-600 via-purple-500 to-violet-400 bg-clip-text text-transparent">
              Sleep Tracker
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Monitor your sleep duration and quality patterns
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
              <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Last Night</p>
              <p className={`text-3xl font-bold mt-2`} style={{ color: getSleepQuality(stats.latest).color }}>
                {stats.latest}h
              </p>
              <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">
                {getSleepQuality(stats.latest).label}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Average Sleep</p>
              <p className="text-3xl font-bold text-purple-600 mt-2">
                {stats.average}h
              </p>
              <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">per night</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Longest Sleep</p>
              <p className="text-3xl font-bold text-green-600 mt-2">
                {stats.max}h
              </p>
              <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">best night</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Optimal Sleep</p>
              <p className="text-3xl font-bold text-indigo-600 mt-2">{stats.optimalPercentage}%</p>
              <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">
                {stats.optimalSleep} of {stats.count} nights
              </p>
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
              <p className="text-gray-600 dark:text-gray-400">Loading sleep data...</p>
            </div>
          ) : chartData.length === 0 ? (
            <div className="flex items-center justify-center h-96">
              <p className="text-gray-600 dark:text-gray-400">No sleep data available yet.</p>
            </div>
          ) : (
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
                Sleep Duration Over Time
              </h2>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart
                  data={chartData}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    stroke="#e5e7eb"
                  />
                  <XAxis 
                    dataKey="timestamp" 
                    stroke="#6b7280"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis 
                    stroke="#6b7280"
                    style={{ fontSize: '12px' }}
                    label={{ value: 'Hours', angle: -90, position: 'insideLeft' }}
                    domain={[0, 12]}
                  />
                  {/* Reference lines for optimal range */}
                  <ReferenceLine 
                    y={RECOMMENDED_MIN} 
                    stroke="#10b981" 
                    strokeDasharray="3 3"
                    strokeWidth={2}
                    label={{ 
                      value: `Optimal Range`, 
                      position: 'right', 
                      fill: '#10b981', 
                      fontSize: 11,
                      fontWeight: 'bold'
                    }}
                  />
                  <ReferenceLine 
                    y={RECOMMENDED_MAX} 
                    stroke="#10b981" 
                    strokeDasharray="3 3"
                    strokeWidth={2}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: '1px solid #6366f1',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                    formatter={(value) => [value + ' hours', 'Sleep Duration']}
                    labelFormatter={(label) => `Date: ${label}`}
                  />
                  <Legend />
                  <Bar 
                    dataKey="value" 
                    name="Sleep Hours"
                    radius={[8, 8, 0, 0]}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getSleepQuality(entry.value).color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              
              {/* Legend for colors */}
              <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-500 rounded"></div>
                  <span className="text-gray-600 dark:text-gray-400">Optimal (7-9h)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-500 rounded"></div>
                  <span className="text-gray-600 dark:text-gray-400">Extended (9-10h)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-orange-500 rounded"></div>
                  <span className="text-gray-600 dark:text-gray-400">Below Optimal (6-7h)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-orange-600 rounded"></div>
                  <span className="text-gray-600 dark:text-gray-400">Insufficient (5-6h)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-500 rounded"></div>
                  <span className="text-gray-600 dark:text-gray-400">Critical (&lt;5h)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-indigo-500 rounded"></div>
                  <span className="text-gray-600 dark:text-gray-400">Oversleep (&gt;10h)</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sleep Tips */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 p-6 rounded-lg">
            <h3 className="font-semibold text-indigo-900 dark:text-indigo-200 text-lg mb-3">😴 Better Sleep Tips</h3>
            <ul className="space-y-2 text-sm text-indigo-800 dark:text-indigo-300">
              <li>• <strong>Consistent Schedule:</strong> Go to bed and wake up at the same time daily</li>
              <li>• <strong>Cool Environment:</strong> Keep bedroom temperature between 60-67°F (15-19°C)</li>
              <li>• <strong>Limit Screen Time:</strong> Avoid screens 1 hour before bedtime</li>
              <li>• <strong>Relaxation Routine:</strong> Practice meditation or light reading</li>
              <li>• <strong>Avoid Caffeine:</strong> No caffeine 6 hours before sleep</li>
            </ul>
          </div>

          <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 p-6 rounded-lg">
            <h3 className="font-semibold text-purple-900 dark:text-purple-200 text-lg mb-3">💡 Sleep Benefits</h3>
            <ul className="space-y-2 text-sm text-purple-800 dark:text-purple-300">
              <li>• <strong>Memory & Learning:</strong> Consolidates memories and improves focus</li>
              <li>• <strong>Physical Health:</strong> Repairs tissues and strengthens immune system</li>
              <li>• <strong>Emotional Balance:</strong> Regulates mood and reduces stress</li>
              <li>• <strong>Metabolism:</strong> Helps maintain healthy weight and blood sugar</li>
              <li>• <strong>Heart Health:</strong> Reduces risk of cardiovascular disease</li>
            </ul>
          </div>
        </div>

        {/* Sleep Quality Categories */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-lg">
            <h4 className="font-semibold text-red-900 dark:text-red-200">Sleep Deprived</h4>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-2">&lt; 6h</p>
            <p className="text-sm text-red-700 dark:text-red-300 mt-1">Poor quality</p>
          </div>
          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 p-4 rounded-lg">
            <h4 className="font-semibold text-orange-900 dark:text-orange-200">Suboptimal</h4>
            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-2">6-7h</p>
            <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">Below recommended</p>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4 rounded-lg">
            <h4 className="font-semibold text-green-900 dark:text-green-200">Optimal</h4>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-2">7-9h</p>
            <p className="text-sm text-green-700 dark:text-green-300 mt-1">Recommended range</p>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-900 dark:text-blue-200">Extended</h4>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-2">&gt; 9h</p>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">May vary by need</p>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-6 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-200 dark:border-indigo-800 p-4 rounded-lg">
          <h3 className="font-semibold text-indigo-900 dark:text-indigo-200">Sleep Quality Information</h3>
          <div className="mt-2 text-sm text-indigo-800 dark:text-indigo-300 space-y-1">
            <p>• <strong>Adults (18-64):</strong> 7-9 hours recommended per night</p>
            <p>• <strong>Quality matters:</strong> Uninterrupted sleep in a dark, quiet environment is more restorative</p>
            <p>• <strong>Sleep debt:</strong> Chronic sleep deprivation accumulates and affects health over time</p>
            <p>• <strong>Individual needs:</strong> Some people naturally need more or less sleep than average</p>
          </div>
        </div>
      </main>
    </div>
  );
}
