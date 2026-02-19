'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar/Navbar';
import { useAuth } from '@/hooks/useAuth';
import PeriodSelector from '@/components/HeartRate/PeriodSelector';
import StatCard from '@/components/Dashboard/StatCard';
import StepsChart from '@/components/Dashboard/StepsChart';
import StepsDataManagement from '@/components/Dashboard/StepsDataManagement';
import StepsInfo from '@/components/Dashboard/StepsInfo';

export default function StepsChartPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [chartData, setChartData] = useState([]);
  const [stats, setStats] = useState(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState('today');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [refreshKey, setRefreshKey] = useState(0);

  const GOAL = 10000; // Daily step goal

  const stepsPeriodOptions = [
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'year', label: '1 Year' }
  ];

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  const fetchStepsData = async () => {
    try {
      setDataLoading(true);
      let url = `/api/biometrics/steps?period=${period}`;
      
      // If period is "today", include the selected date
      if (period === 'today') {
        url += `&date=${selectedDate}`;
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch steps data');
      }

      const result = await response.json();
      setChartData(result.data);
      setStats(result.stats);
      setError(null);
    } catch (err) {
      console.error('Error fetching steps data:', err);
      setError(err.message);
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchStepsData();
    }
  }, [user, period, selectedDate, refreshKey]);

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

        {/* Period Selector */}
        <PeriodSelector period={period} onPeriodChange={setPeriod} periodOptions={stepsPeriodOptions} />

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
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        {/* Data Management Section */}
        {period === 'today' && (
          <StepsDataManagement 
            selectedDate={selectedDate}
            onDataGenerated={() => setRefreshKey(prev => prev + 1)}
          />
        )}

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <StatCard
              label="Total Steps"
              value={stats.total}
              subLabel={period === 'today' ? 'steps' : period === 'year' ? 'total steps' : 'total steps'}
              color="blue"
            />
            <StatCard
              label={period === 'today' ? 'Daily Average' : period === 'year' ? 'Average Steps/Month' : 'Average Daily Steps'}
              value={stats.average}
              subLabel={period === 'today' ? 'steps/hour' : period === 'year' ? 'steps/day' : 'steps/day'}
              color="purple"
            />
            <StatCard
              label="Peak"
              value={stats.max}
              subLabel={period === 'today' ? 'steps/hour' : period === 'year' ? 'steps/day' : 'steps'}
              color="green"
            />
            <StatCard
              label={period === 'today' ? 'Goal Achievement' : period === 'year' ? 'Months with Data' : 'Days with Data'}
              value={period === 'today' ? (stats.goalAchieved ? 'Achieved' : 'Not Met') : period === 'year' ? stats.monthsWithData : stats.daysWithData}
              subLabel={period === 'today' ? `${stats.goal} steps/day goal` : period === 'year' ? `of ${stats.totalMonths} months` : `of ${stats.totalDays} days`}
              color="orange"
            />
          </div>
        )}

        {/* Chart Section */}
        <StepsChart 
          chartData={chartData}
          dataLoading={dataLoading}
          error={error}
          period={period}
        />

        {/* Additional Info */}
        <StepsInfo period={period} />
      </main>
    </div>
  );
}
