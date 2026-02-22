'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar/Navbar';
import { useAuth } from '@/hooks/useAuth';
import StatCard from '@/components/Sleep/StatCard';
import InfoCard from '@/components/Sleep/InfoCard';
import RadialChartCard from '@/components/Sleep/RadialChartCard';

export default function SleepChartPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [chartData, setChartData] = useState([]);
  const [stats, setStats] = useState(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState(null);

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
        const response = await fetch(`/api/biometrics/sleep?date=${selectedDate}`);
        
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
  }, [user, selectedDate]);

  // Get radial chart data for current progress
  const getRadialData = () => {
    if (!stats) return [];
    
    const progress = stats.currentProgress || 0;
    
    return [
      {
        name: 'Progress',
        value: progress,
        fill: progress >= 100 ? '#10b981' : progress >= 85 ? '#3b82f6' : progress >= 70 ? '#f59e0b' : '#ef4444'
      }
    ];
  };

  // Get quality label and color based on sleep hours
  const getSleepQuality = (hours) => {
    if (hours < 5) return { color: '#ef4444', label: 'Critical' };
    if (hours < 6) return { color: '#f97316', label: 'Insufficient' };
    if (hours < 7) return { color: '#f59e0b', label: 'Below Optimal' };
    if (hours >= 7 && hours <= 9) return { color: '#10b981', label: 'Optimal' };
    if (hours > 9 && hours <= 10) return { color: '#3b82f6', label: 'Extended' };
    return { color: '#6366f1', label: 'Oversleep' };
  };

  // Get bar color based on sleep hours
  const getBarColor = (value) => {
    return getSleepQuality(value).color;
  };

  // Handle delete sleep data
  const handleDeleteData = async () => {
    if (!confirm(`Are you sure you want to delete sleep data for ${selectedDate}? This action cannot be undone.`)) {
      return;
    }

    try {
      setActionLoading(true);
      setActionMessage(null);
      
      const response = await fetch('/api/biometrics/sleep/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: selectedDate })
      });

      if (!response.ok) {
        throw new Error('Failed to delete sleep data');
      }

      const result = await response.json();
      setActionMessage({ type: 'success', text: result.message });
      
      // Refresh the data
      await new Promise(resolve => setTimeout(resolve, 500));
      const refreshResponse = await fetch(`/api/biometrics/sleep?date=${selectedDate}`);
      const refreshResult = await refreshResponse.json();
      setChartData(refreshResult.data);
      setStats(refreshResult.stats);
    } catch (err) {
      setActionMessage({ type: 'error', text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  // Handle generate sleep data
  const handleGenerateData = async () => {
    try {
      setActionLoading(true);
      setActionMessage(null);
      
      const response = await fetch('/api/biometrics/sleep/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: selectedDate })
      });

      if (!response.ok) {
        throw new Error('Failed to generate sleep data');
      }

      const result = await response.json();
      setActionMessage({ type: 'success', text: result.message });
      
      // Refresh the data
      await new Promise(resolve => setTimeout(resolve, 500));
      const refreshResponse = await fetch(`/api/biometrics/sleep?date=${selectedDate}`);
      const refreshResult = await refreshResponse.json();
      setChartData(refreshResult.data);
      setStats(refreshResult.stats);
    } catch (err) {
      setActionMessage({ type: 'error', text: err.message });
    } finally {
      setActionLoading(false);
    }
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
      <main className="flex-1 p-8 ml-20 overflow-auto bg-purple-50 dark:bg-gray-950 text-gray-900 dark:text-gray-50">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="inline-block text-3xl font-bold bg-gradient-to-br from-purple-600 via-indigo-500 to-blue-400 bg-clip-text text-transparent">
              Sleep Tracker
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              {selectedDate === new Date().toISOString().split('T')[0] 
                ? 'Monitor your sleep patterns and quality' 
                : `Viewing sleep data for ${new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`}
            </p>
          </div>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-gray-300 hover:bg-gray-400 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium rounded-lg transition-colors"
          >
            Back
          </button>
        </div>

        {/* Date Picker */}
        <div className="flex flex-col gap-2 mb-8">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Select Date:</label>
          <div className="flex gap-3 items-end">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <button
              onClick={handleDeleteData}
              disabled={actionLoading}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 disabled:bg-red-300 dark:bg-red-600 dark:hover:bg-red-700 dark:disabled:bg-red-800 text-white font-medium rounded-lg transition-colors"
            >
              {actionLoading ? 'Processing...' : 'Delete Data'}
            </button>
            <button
              onClick={handleGenerateData}
              disabled={actionLoading}
              className="px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-green-300 dark:bg-green-600 dark:hover:bg-green-700 dark:disabled:bg-green-800 text-white font-medium rounded-lg transition-colors"
            >
              {actionLoading ? 'Processing...' : 'Generate Data'}
            </button>
          </div>
        </div>

        {/* Action Message */}
        {actionMessage && (
          <div className={`mb-6 p-4 rounded-lg ${
            actionMessage.type === 'success' 
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400' 
              : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400'
          }`}>
            {actionMessage.text}
          </div>
        )}

        {/* Statistics Cards */}
        {stats && stats.latest > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <StatCard 
              label="Last Night's Sleep" 
              value={`${stats.latest}h`}
              sublabel={getSleepQuality(stats.latest).label}
              color={getSleepQuality(stats.latest).color}
            />
            <StatCard 
              label="Average Sleep" 
              value={`${stats.average}h`}
              sublabel={`${stats.count} nights tracked`}
              color="#a855f7"
            />
            <StatCard 
              label="Best Sleep" 
              value={`${stats.max}h`}
              sublabel="longest night"
              color="#10b981"
            />
            <StatCard 
              label="Sleep Quality" 
              value={`${stats.optimalPercentage}%`}
              sublabel={`${stats.optimalNights}/${stats.count} optimal`}
              color="#4f46e5"
            />
          </div>
        )}

        {/* Radial Progress Chart & History */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Current Progress - Radial Chart */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
            <RadialChartCard
              dataLoading={dataLoading}
              error={error}
              stats={stats}
              selectedDate={selectedDate}
              RECOMMENDED_MIN={RECOMMENDED_MIN}
              getRadialData={getRadialData}
            />
          </div>

          {/* Sleep Tips */}
          <InfoCard
            icon="😴"
            title="Sleep Tips"
            bgColor="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border border-purple-200 dark:border-purple-800"
            textColor="text-purple-900 dark:text-purple-200"
            items={[
              { label: '🕐 Consistent Schedule', description: 'Go to bed and wake up at the same time daily' },
              { label: '🌡️ Cool Environment', description: 'Keep bedroom temperature between 60-67°F' },
              { label: '📱 Limit Screen Time', description: 'Avoid screens 1 hour before bedtime' },
              { label: '☕ Avoid Caffeine', description: 'No caffeine 6 hours before sleep' }
            ]}
          />
        </div>

        {/* Sleep Quality Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <InfoCard
            icon="💚"
            title="Sleep Benefits"
            bgColor="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800"
            textColor="text-green-900 dark:text-green-200"
            items={[
              { label: 'Memory & Learning', description: 'Consolidates memories and improves focus' },
              { label: 'Physical Health', description: 'Repairs tissues and strengthens immune system' },
              { label: 'Emotional Balance', description: 'Regulates mood and reduces stress' },
              { label: 'Metabolism', description: 'Helps maintain healthy weight and blood sugar' }
            ]}
          />

          <InfoCard
            icon="📊"
            title="Sleep Guidelines"
            bgColor="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-200 dark:border-indigo-800"
            textColor="text-indigo-900 dark:text-indigo-200"
            items={[
              { label: 'Adults (18-64)', description: '7-9 hours recommended per night' },
              { label: 'Quality matters', description: 'Uninterrupted sleep is more restorative' },
              { label: 'Sleep cycles', description: 'About 90 minutes per cycle; 5-6 cycles optimal' },
              { label: 'Individual needs', description: 'Some need more or less than average' }
            ]}
          />
        </div>
      </main>
    </div>
  );
}
