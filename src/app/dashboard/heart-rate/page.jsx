'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar/Navbar';
import { useAuth } from '@/hooks/useAuth';
import PeriodSelector from '@/components/HeartRate/PeriodSelector';
import StatsGrid from '@/components/HeartRate/StatsGrid';
import HeartRateChart from '@/components/HeartRate/HeartRateChart';
import HeartRateInfo from '@/components/HeartRate/HeartRateInfo';

export default function HeartRateChartPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [chartData, setChartData] = useState([]);
  const [stats, setStats] = useState(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState('today');
  const [chartType, setChartType] = useState('area');
  const [useRangeBar, setUseRangeBar] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [startDateRange, setStartDateRange] = useState('');
  const [endDateRange, setEndDateRange] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    const fetchHeartRateData = async () => {
      try {
        setDataLoading(true);
        let url = `/api/biometrics/heart-rate?period=${period}`;
        
        // If period is "today", include the selected date
        if (period === 'today') {
          url += `&date=${selectedDate}`;
        }
        
        // If period is "all", include the date range
        if (period === 'all' && startDateRange) {
          url += `&startDate=${startDateRange}&endDate=${endDateRange}`;
        }
        
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error('Failed to fetch heart rate data');
        }

        const result = await response.json();
        setChartData(result.data);
        setStats(result.stats);
        setChartType(result.chartType || 'area');
        setUseRangeBar(result.useRangeBar || false);
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
  }, [user, period, selectedDate, startDateRange, endDateRange]);

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

        {/* Period Selector */}
        <PeriodSelector period={period} onPeriodChange={setPeriod} />

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

        {/* Date Range Picker - only show for "all" period */}
        {period === 'all' && (
          <div className="mb-6 flex items-center gap-4">
            <label htmlFor="start-date-picker" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Start Date:
            </label>
            <input
              id="start-date-picker"
              type="date"
              value={startDateRange}
              onChange={(e) => setStartDateRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <label htmlFor="end-date-picker" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              End Date:
            </label>
            <input
              id="end-date-picker"
              type="date"
              value={endDateRange}
              onChange={(e) => setEndDateRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        {/* Statistics Cards */}
        <StatsGrid stats={stats} />

        {/* Chart */}
        <HeartRateChart period={period} chartData={chartData} dataLoading={dataLoading} error={error} chartType={chartType} useRangeBar={useRangeBar} />

        {/* Additional Info */}
        <HeartRateInfo />
      </main>
    </div>
  );
}
