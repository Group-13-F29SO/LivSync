'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar/Navbar';
import { useAuth } from '@/hooks/useAuth';
import {
  RadialBarChart,
  RadialBar,
  Legend,
  ResponsiveContainer,
  PolarAngleAxis,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Cell
} from 'recharts';

export default function HydrationChartPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [chartData, setChartData] = useState([]);
  const [stats, setStats] = useState(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState(null);

  const GOAL = 8; // Daily hydration goal in glasses

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    const fetchHydrationData = async () => {
      try {
        setDataLoading(true);
        const response = await fetch('/api/biometrics/hydration');
        
        if (!response.ok) {
          throw new Error('Failed to fetch hydration data');
        }

        const result = await response.json();
        setChartData(result.data);
        setStats(result.stats);
      } catch (err) {
        console.error('Error fetching hydration data:', err);
        setError(err.message);
      } finally {
        setDataLoading(false);
      }
    };

    if (user) {
      fetchHydrationData();
    }
  }, [user]);

  // Get radial chart data for current progress
  const getRadialData = () => {
    if (!stats) return [];
    
    const progress = Math.min(stats.currentProgress, 100);
    const remaining = Math.max(100 - progress, 0);
    
    return [
      {
        name: 'Progress',
        value: progress,
        fill: progress >= 100 ? '#10b981' : progress >= 75 ? '#3b82f6' : progress >= 50 ? '#f59e0b' : '#ef4444'
      }
    ];
  };

  // Get bar color based on goal achievement
  const getBarColor = (value) => {
    if (value >= GOAL) return '#10b981'; // Green - goal achieved
    if (value >= GOAL * 0.75) return '#3b82f6'; // Blue - 75%+ of goal
    if (value >= GOAL * 0.5) return '#f59e0b'; // Orange - 50%+ of goal
    return '#ef4444'; // Red - below 50%
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
            <h1 className="inline-block text-3xl font-bold bg-gradient-to-br from-blue-600 via-cyan-500 to-teal-400 bg-clip-text text-transparent">
              Hydration Tracker
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Monitor your daily water intake and stay hydrated
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
              <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Current Progress</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">
                {stats.latest}/{GOAL}
              </p>
              <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">glasses today</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Daily Average</p>
              <p className="text-3xl font-bold text-cyan-600 mt-2">
                {stats.average}
              </p>
              <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">glasses/day</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Best Day</p>
              <p className="text-3xl font-bold text-green-600 mt-2">
                {stats.max}
              </p>
              <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">glasses</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Goal Achievement</p>
              <p className="text-3xl font-bold text-teal-600 mt-2">{stats.goalPercentage}%</p>
              <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">
                {stats.goalAchievement} of {stats.count} days
              </p>
            </div>
          </div>
        )}

        {/* Radial Progress Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Current Progress - Radial Chart */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
            {error ? (
              <div className="text-red-600 dark:text-red-400 p-4 bg-red-50 dark:bg-red-900/20 rounded">
                Error: {error}
              </div>
            ) : dataLoading ? (
              <div className="flex items-center justify-center h-96">
                <p className="text-gray-600 dark:text-gray-400">Loading hydration data...</p>
              </div>
            ) : !stats ? (
              <div className="flex items-center justify-center h-96">
                <p className="text-gray-600 dark:text-gray-400">No hydration data available yet.</p>
              </div>
            ) : (
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
                  Today's Progress
                </h2>
                <ResponsiveContainer width="100%" height={350}>
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
                      fill="#3b82f6"
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
                      of {GOAL} glasses
                    </text>
                  </RadialBarChart>
                </ResponsiveContainer>
                <div className="text-center mt-4">
                  <p className="text-2xl font-bold" style={{ color: getRadialData()[0]?.fill }}>
                    {stats.currentProgress}%
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {stats.latest >= GOAL ? '🎉 Goal Achieved!' : `${GOAL - stats.latest} glasses to go`}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Hydration Tips */}
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 p-6 rounded-lg shadow-lg border border-blue-200 dark:border-blue-800">
            <h3 className="text-lg font-bold text-blue-900 dark:text-blue-200 mb-4">💧 Hydration Tips</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold">1</div>
                <div>
                  <p className="font-semibold text-blue-900 dark:text-blue-200">Start Your Day Right</p>
                  <p className="text-sm text-blue-800 dark:text-blue-300">Drink a glass of water first thing in the morning</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-cyan-500 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold">2</div>
                <div>
                  <p className="font-semibold text-blue-900 dark:text-blue-200">Set Reminders</p>
                  <p className="text-sm text-blue-800 dark:text-blue-300">Use hourly reminders to maintain consistent intake</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-teal-500 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold">3</div>
                <div>
                  <p className="font-semibold text-blue-900 dark:text-blue-200">Before Meals</p>
                  <p className="text-sm text-blue-800 dark:text-blue-300">Drink water 30 minutes before eating to aid digestion</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold">4</div>
                <div>
                  <p className="font-semibold text-blue-900 dark:text-blue-200">During Exercise</p>
                  <p className="text-sm text-blue-800 dark:text-blue-300">Increase intake when physically active</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Historical Chart */}
        {chartData.length > 0 && (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg mb-8">
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
              Hydration History
            </h2>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="timestamp" 
                  stroke="#6b7280"
                  style={{ fontSize: '12px' }}
                />
                <YAxis 
                  stroke="#6b7280"
                  style={{ fontSize: '12px' }}
                  label={{ value: 'Glasses', angle: -90, position: 'insideLeft' }}
                />
                <ReferenceLine 
                  y={GOAL} 
                  stroke="#10b981" 
                  strokeDasharray="3 3"
                  strokeWidth={2}
                  label={{ 
                    value: `Goal: ${GOAL} glasses`, 
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
                  formatter={(value) => [value + ' glasses', 'Hydration']}
                />
                <Legend />
                <Bar 
                  dataKey="value" 
                  name="Glasses"
                  radius={[8, 8, 0, 0]}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getBarColor(entry.value)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Additional Info */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg">
          <h3 className="font-semibold text-blue-900 dark:text-blue-200">Hydration Benefits</h3>
          <ul className="mt-2 text-sm text-blue-800 dark:text-blue-300 space-y-1">
            <li>• <strong>Recommended Daily:</strong> 8 glasses (64 oz) of water per day</li>
            <li>• <strong>Energy Boost:</strong> Proper hydration improves energy levels and brain function</li>
            <li>• <strong>Physical Performance:</strong> Even mild dehydration can impair physical performance</li>
            <li>• <strong>Skin Health:</strong> Adequate water intake helps maintain healthy, glowing skin</li>
            <li>• <strong>Weight Management:</strong> Drinking water before meals can help with portion control</li>
          </ul>
        </div>

        {/* Hydration Levels */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-lg">
            <h4 className="font-semibold text-red-900 dark:text-red-200">Dehydrated</h4>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-2">&lt; 4</p>
            <p className="text-sm text-red-700 dark:text-red-300 mt-1">glasses/day</p>
          </div>
          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 p-4 rounded-lg">
            <h4 className="font-semibold text-orange-900 dark:text-orange-200">Under-hydrated</h4>
            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-2">4-5</p>
            <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">glasses/day</p>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-900 dark:text-blue-200">Good Hydration</h4>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-2">6-7</p>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">glasses/day</p>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4 rounded-lg">
            <h4 className="font-semibold text-green-900 dark:text-green-200">Optimal</h4>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-2">≥ 8</p>
            <p className="text-sm text-green-700 dark:text-green-300 mt-1">glasses/day</p>
          </div>
        </div>
      </main>
    </div>
  );
}
