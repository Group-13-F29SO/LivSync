'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar/Navbar';
import PeriodSelector from '@/components/HeartRate/PeriodSelector';
import CaloriesDataManagement from '@/components/Dashboard/Calories/CaloriesDataManagement';
import CaloriesChart from '@/components/Dashboard/Calories/CaloriesChart';
import CaloriesStats from '@/components/Dashboard/Calories/CaloriesStats';
import CaloriesInfo from '@/components/Dashboard/Calories/CaloriesInfo';
import { useAuth } from '@/hooks/useAuth';

export default function CaloriesChartPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [chartData, setChartData] = useState([]);
  const [stats, setStats] = useState(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState('today');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [refreshKey, setRefreshKey] = useState(0);

  const caloriesPeriodOptions = [
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' }
  ];

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  const fetchCaloriesData = async () => {
    try {
      setDataLoading(true);
      let url = `/api/biometrics/calories?period=${period}`;
      
      // If period is "today", include the selected date
      if (period === 'today') {
        url += `&date=${selectedDate}`;
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch calories data');
      }

      const result = await response.json();
      setChartData(result.data);
      setStats(result.stats);
      setError(null);
    } catch (err) {
      console.error('Error fetching calories data:', err);
      setError(err.message);
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchCaloriesData();
    }
  }, [user, period, selectedDate, refreshKey]);

  // Get activity level based on calories burned
  const getActivityLevel = (calories) => {
    if (calories < 1500) return { level: 'Sedentary', color: 'text-red-600' };
    if (calories < 2000) return { level: 'Lightly Active', color: 'text-orange-600' };
    if (calories < 2500) return { level: 'Moderately Active', color: 'text-blue-600' };
    if (calories < 3000) return { level: 'Very Active', color: 'text-green-600' };
    return { level: 'Extremely Active', color: 'text-purple-600' };
  };

  const activityLevel = stats ? getActivityLevel(stats.latest || stats.max || 0) : null;

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

        {/* Period Selector */}
        <PeriodSelector period={period} onPeriodChange={setPeriod} periodOptions={caloriesPeriodOptions} />

        {/* Date Picker - only show for "today" period */}
        {period === 'today' && (
          <div className="mb-6 flex items-center gap-4">
            <label htmlFor="date-picker" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Select Date:
            </label>
            <input
              id="date-picker"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        )}

        {/* Data Management Section - only show for "today" period */}
        {period === 'today' && (
          <CaloriesDataManagement 
            selectedDate={selectedDate}
            onDataGenerated={() => setRefreshKey(prev => prev + 1)}
          />
        )}

        {/* Statistics Cards */}
        <CaloriesStats stats={stats} period={period} activityLevel={activityLevel} />

        {/* Chart Section */}
        <CaloriesChart chartData={chartData} dataLoading={dataLoading} error={error} period={period} />

        {/* Calorie Information */}
        <CaloriesInfo />
      </main>
    </div>
  );
}
