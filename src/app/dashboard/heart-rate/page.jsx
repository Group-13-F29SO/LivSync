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

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    const fetchHeartRateData = async () => {
      try {
        setDataLoading(true);
        const response = await fetch(`/api/biometrics/heart-rate?period=${period}`);
        
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
  }, [user, period]);

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

        {/* Statistics Cards */}
        <StatsGrid stats={stats} />

        {/* Chart */}
        <HeartRateChart period={period} chartData={chartData} dataLoading={dataLoading} error={error} />

        {/* Additional Info */}
        <HeartRateInfo />
      </main>
    </div>
  );
}
