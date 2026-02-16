'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar/Navbar';
import { useAuth } from '@/hooks/useAuth';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  LineChart,
  Line
} from 'recharts';

export default function CaloriesChartPage() {
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
    const fetchCaloriesData = async () => {
      try {
        setDataLoading(true);
        const response = await fetch('/api/biometrics/calories');
        
        if (!response.ok) {
          throw new Error('Failed to fetch calories data');
        }

        const result = await response.json();
        setChartData(result.data);
        setStats(result.stats);
      } catch (err) {
        console.error('Error fetching calories data:', err);
        setError(err.message);
      } finally {
        setDataLoading(false);
      }
    };

    if (user) {
      fetchCaloriesData();
    }
  }, [user]);

  // Get activity level based on calories burned
  const getActivityLevel = (calories) => {
    if (calories < 1500) return { level: 'Sedentary', color: 'text-red-600' };
    if (calories < 2000) return { level: 'Lightly Active', color: 'text-orange-600' };
    if (calories < 2500) return { level: 'Moderately Active', color: 'text-blue-600' };
    if (calories < 3000) return { level: 'Very Active', color: 'text-green-600' };
    return { level: 'Extremely Active', color: 'text-purple-600' };
  };

  const activityLevel = stats ? getActivityLevel(stats.latest) : null;

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
            <h1 className="inline-block text-3xl font-bold bg-gradient-to-br from-orange-600 via-red-500 to-pink-400 bg-clip-text text-transparent">
              Calories Burned Tracker
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Monitor your daily calorie expenditure and activity level
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
              <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Latest Reading</p>
              <p className={`text-3xl font-bold mt-2 ${activityLevel?.color || 'text-orange-600'}`}>
                {stats.latest.toLocaleString()}
              </p>
              <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">kcal burned</p>
              {activityLevel && (
                <p className={`text-sm font-medium ${activityLevel.color} mt-2`}>
                  {activityLevel.level}
                </p>
              )}
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Daily Average</p>
              <p className="text-3xl font-bold text-red-600 mt-2">
                {stats.average.toLocaleString()}
              </p>
              <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">kcal/day</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Peak Day</p>
              <p className="text-3xl font-bold text-green-600 mt-2">
                {stats.max.toLocaleString()}
              </p>
              <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">kcal</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Total Burned</p>
              <p className="text-3xl font-bold text-purple-600 mt-2">
                {(stats.total / 1000).toFixed(1)}k
              </p>
              <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">kcal total</p>
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
              <p className="text-gray-600 dark:text-gray-400">Loading calories data...</p>
            </div>
          ) : chartData.length === 0 ? (
            <div className="flex items-center justify-center h-96">
              <p className="text-gray-600 dark:text-gray-400">No calories data available yet.</p>
            </div>
          ) : (
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
                Calories Burned Over Time
              </h2>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart
                  data={chartData}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorCalories" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
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
                    label={{ value: 'Calories (kcal)', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: '1px solid #f97316',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                    formatter={(value) => [value.toLocaleString() + ' kcal', 'Calories Burned']}
                  />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#f97316" 
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorCalories)"
                    name="Calories Burned (kcal)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Calorie Information */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 p-6 rounded-lg">
            <h3 className="font-semibold text-orange-900 dark:text-orange-200 text-lg mb-3">🔥 Calorie Burn Facts</h3>
            <ul className="space-y-2 text-sm text-orange-800 dark:text-orange-300">
              <li>• <strong>Basal Metabolic Rate (BMR):</strong> Calories burned at rest (typically 1,200-1,800 kcal/day)</li>
              <li>• <strong>Physical Activity:</strong> Exercise and movement increase calorie expenditure</li>
              <li>• <strong>Thermic Effect:</strong> Digesting food burns ~10% of consumed calories</li>
              <li>• <strong>3,500 Rule:</strong> ~3,500 kcal deficit needed to lose 1 pound of fat</li>
              <li>• <strong>Muscle Mass:</strong> More muscle = higher resting metabolism</li>
            </ul>
          </div>

          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-6 rounded-lg">
            <h3 className="font-semibold text-red-900 dark:text-red-200 text-lg mb-3">💪 Boost Calorie Burn</h3>
            <ul className="space-y-2 text-sm text-red-800 dark:text-red-300">
              <li>• <strong>Increase Intensity:</strong> High-intensity interval training (HIIT) burns more calories</li>
              <li>• <strong>Build Muscle:</strong> Strength training increases metabolic rate</li>
              <li>• <strong>Stay Active:</strong> Take stairs, walk more, reduce sitting time</li>
              <li>• <strong>Hydrate:</strong> Drinking water temporarily boosts metabolism</li>
              <li>• <strong>Sleep Well:</strong> Poor sleep can slow metabolism and reduce calorie burn</li>
            </ul>
          </div>
        </div>

        {/* Activity Level Categories */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-lg">
            <h4 className="font-semibold text-red-900 dark:text-red-200">Sedentary</h4>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-2">&lt; 1,500</p>
            <p className="text-sm text-red-700 dark:text-red-300 mt-1">kcal/day</p>
          </div>
          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 p-4 rounded-lg">
            <h4 className="font-semibold text-orange-900 dark:text-orange-200">Lightly Active</h4>
            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-2">1,500-2,000</p>
            <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">kcal/day</p>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-900 dark:text-blue-200">Moderately Active</h4>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-2">2,000-2,500</p>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">kcal/day</p>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4 rounded-lg">
            <h4 className="font-semibold text-green-900 dark:text-green-200">Very Active</h4>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-2">2,500-3,000</p>
            <p className="text-sm text-green-700 dark:text-green-300 mt-1">kcal/day</p>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 p-4 rounded-lg">
            <h4 className="font-semibold text-purple-900 dark:text-purple-200">Extremely Active</h4>
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-2">≥ 3,000</p>
            <p className="text-sm text-purple-700 dark:text-purple-300 mt-1">kcal/day</p>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-6 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border border-orange-200 dark:border-orange-800 p-4 rounded-lg">
          <h3 className="font-semibold text-orange-900 dark:text-orange-200">Calorie Balance & Weight Management</h3>
          <div className="mt-2 text-sm text-orange-800 dark:text-orange-300 space-y-1">
            <p>• <strong>Weight Loss:</strong> Burn more calories than you consume (calorie deficit)</p>
            <p>• <strong>Weight Gain:</strong> Consume more calories than you burn (calorie surplus)</p>
            <p>• <strong>Maintenance:</strong> Balance calorie intake with expenditure</p>
            <p>• <strong>Factors:</strong> Age, gender, weight, height, and activity level affect daily calorie needs</p>
            <p>• <strong>Healthy Rate:</strong> Safe weight loss is 1-2 pounds per week (500-1,000 kcal deficit/day)</p>
          </div>
        </div>
      </main>
    </div>
  );
}
