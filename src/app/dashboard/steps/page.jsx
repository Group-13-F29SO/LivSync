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
  Cell
} from 'recharts';

export default function StepsChartPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [chartData, setChartData] = useState([]);
  const [stats, setStats] = useState(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState(null);

  const GOAL = 10000; // Daily step goal

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    const fetchStepsData = async () => {
      try {
        setDataLoading(true);
        const response = await fetch('/api/biometrics/steps');
        
        if (!response.ok) {
          throw new Error('Failed to fetch steps data');
        }

        const result = await response.json();
        setChartData(result.data);
        setStats(result.stats);
      } catch (err) {
        console.error('Error fetching steps data:', err);
        setError(err.message);
      } finally {
        setDataLoading(false);
      }
    };

    if (user) {
      fetchStepsData();
    }
  }, [user]);

  // Get bar color based on goal achievement
  const getBarColor = (value) => {
    if (value >= GOAL) return '#10b981'; // Green - goal achieved
    if (value >= GOAL * 0.75) return '#f59e0b'; // Orange - 75%+ of goal
    return '#ef4444'; // Red - below 75%
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
            <h1 className="inline-block text-3xl font-bold bg-gradient-to-br from-blue-600 via-purple-500 to-pink-400 bg-clip-text text-transparent">
              Steps Tracker
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Monitor your daily step count and activity level
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
              <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Total Steps</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">
                {stats.total.toLocaleString()}
              </p>
              <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">steps</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Daily Average</p>
              <p className="text-3xl font-bold text-purple-600 mt-2">
                {stats.average.toLocaleString()}
              </p>
              <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">steps/day</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Best Day</p>
              <p className="text-3xl font-bold text-green-600 mt-2">
                {stats.max.toLocaleString()}
              </p>
              <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">steps</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Goal Achievement</p>
              <p className="text-3xl font-bold text-orange-600 mt-2">{stats.goalPercentage}%</p>
              <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">
                {stats.goalAchievement} of {stats.count} days
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
              <p className="text-gray-600 dark:text-gray-400">Loading steps data...</p>
            </div>
          ) : chartData.length === 0 ? (
            <div className="flex items-center justify-center h-96">
              <p className="text-gray-600 dark:text-gray-400">No steps data available yet.</p>
            </div>
          ) : (
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
                Steps Over Time
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
                    label={{ value: 'Steps', angle: -90, position: 'insideLeft' }}
                  />
                  {/* Reference line for goal */}
                  <ReferenceLine 
                    y={GOAL} 
                    stroke="#10b981" 
                    strokeDasharray="3 3"
                    strokeWidth={2}
                    label={{ 
                      value: `Goal: ${GOAL.toLocaleString()}`, 
                      position: 'right', 
                      fill: '#10b981', 
                      fontSize: 12,
                      fontWeight: 'bold'
                    }}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: '1px solid #3b82f6',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                    formatter={(value) => [value.toLocaleString() + ' steps', 'Steps']}
                  />
                  <Legend />
                  <Bar 
                    dataKey="value" 
                    name="Steps"
                    radius={[8, 8, 0, 0]}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getBarColor(entry.value)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              
              {/* Legend for colors */}
              <div className="mt-4 flex items-center justify-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-500 rounded"></div>
                  <span className="text-gray-600 dark:text-gray-400">Goal Achieved (≥10,000)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-orange-500 rounded"></div>
                  <span className="text-gray-600 dark:text-gray-400">Good Progress (≥7,500)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-500 rounded"></div>
                  <span className="text-gray-600 dark:text-gray-400">Below Target (&lt;7,500)</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Additional Info */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg">
          <h3 className="font-semibold text-blue-900 dark:text-blue-200">Steps & Activity Information</h3>
          <ul className="mt-2 text-sm text-blue-800 dark:text-blue-300 space-y-1">
            <li>• <strong>Recommended Daily Goal:</strong> 10,000 steps per day for general health</li>
            <li>• <strong>Minimum Active:</strong> 7,500 steps is considered moderately active</li>
            <li>• <strong>Health Benefits:</strong> Regular walking improves cardiovascular health and mood</li>
            <li>• <strong>Calorie Burn:</strong> ~100 calories burned per 2,000 steps (varies by weight)</li>
            <li>• <strong>Distance:</strong> Average person covers ~5 miles with 10,000 steps</li>
          </ul>
        </div>

        {/* Activity Levels */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 rounded-lg">
            <h4 className="font-semibold text-gray-900 dark:text-gray-200">Sedentary</h4>
            <p className="text-2xl font-bold text-gray-600 dark:text-gray-400 mt-2">&lt; 5,000</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">steps/day</p>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-4 rounded-lg">
            <h4 className="font-semibold text-yellow-900 dark:text-yellow-200">Low Active</h4>
            <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-2">5,000-7,499</p>
            <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">steps/day</p>
          </div>
          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 p-4 rounded-lg">
            <h4 className="font-semibold text-orange-900 dark:text-orange-200">Somewhat Active</h4>
            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-2">7,500-9,999</p>
            <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">steps/day</p>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4 rounded-lg">
            <h4 className="font-semibold text-green-900 dark:text-green-200">Active</h4>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-2">≥ 10,000</p>
            <p className="text-sm text-green-700 dark:text-green-300 mt-1">steps/day</p>
          </div>
        </div>
      </main>
    </div>
  );
}
