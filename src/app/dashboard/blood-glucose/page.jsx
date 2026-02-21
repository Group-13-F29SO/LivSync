'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar/Navbar';
import { useAuth } from '@/hooks/useAuth';
import PeriodSelector from '@/components/BloodGlucose/PeriodSelector';
import StatsGrid from '@/components/BloodGlucose/StatsGrid';
import BloodGlucoseChart from '@/components/BloodGlucose/BloodGlucoseChart';
import BloodGlucoseInfo from '@/components/BloodGlucose/BloodGlucoseInfo';

export default function BloodGlucoseChartPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [chartData, setChartData] = useState([]);
  const [stats, setStats] = useState(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState('today');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    const fetchBloodGlucoseData = async () => {
      try {
        setDataLoading(true);
        let url = `/api/biometrics/blood-glucose?period=${period}`;
        
        // If period is "today", include the selected date
        if (period === 'today') {
          url += `&date=${selectedDate}`;
        }
        
        const response = await fetch(url);
        
        if (!response.ok) {
          throw new Error('Failed to fetch blood glucose data');
        }

        const result = await response.json();
        setChartData(result.data);
        setStats(result.stats);
      } catch (err) {
        console.error('Error fetching blood glucose data:', err);
        setError(err.message);
      } finally {
        setDataLoading(false);
      }
    };

    if (user) {
      fetchBloodGlucoseData();
    }
  }, [user, period, selectedDate]);

  // Determine status based on average
  const getGlucoseStatus = (value) => {
    if (value < 70) return { status: 'Low', color: 'text-yellow-600' };
    if (value >= 70 && value <= 140) return { status: 'Normal', color: 'text-green-600' };
    if (value > 140 && value <= 180) return { status: 'Elevated', color: 'text-orange-600' };
    return { status: 'High', color: 'text-red-600' };
  };

  const statusInfo = stats ? getGlucoseStatus(stats.average) : null;

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
            <h1 className="inline-block text-3xl font-bold bg-gradient-to-br from-indigo-600 via-purple-500 to-pink-400 bg-clip-text text-transparent">
              Blood Glucose Monitor
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Track your blood glucose levels over time
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
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        )}

        {/* Statistics Cards */}
        <StatsGrid stats={stats} />

        {/* Chart Section */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg mb-8">
          <BloodGlucoseChart 
            chartData={chartData}
            period={period}
            dataLoading={dataLoading}
            error={error}
          />
        </div>

        {/* Additional Info */}
        <BloodGlucoseInfo />
      </main>
    </div>
  );
}
