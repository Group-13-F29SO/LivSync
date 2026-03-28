'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import StatCard from '@/components/Sleep/StatCard';
import InfoCard from '@/components/Sleep/InfoCard';
import RadialChartCard from '@/components/Sleep/RadialChartCard';
import MetricManualEntrySection from '@/components/Dashboard/MetricManualEntrySection';

function getLocalDateString() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function SleepChartPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [selectedDate, setSelectedDate] = useState(getLocalDateString());
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
    // Only allow patients to access this page
    if (!isLoading && user && user.userType === 'provider') {
      router.push('/provider');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    const fetchSleepData = async () => {
      try {
        setDataLoading(true);
        const response = await fetch(`/api/biometrics/sleep?date=${selectedDate}`, {
          credentials: 'include',
          cache: 'no-store',
        });        
        if (!response.ok) {
          throw new Error('Failed to fetch sleep data');
        }

        const result = await response.json();
        if (result.selectedDate) {
          setSelectedDate(result.selectedDate);
        }

        
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
    
    // Use user's goal if set, otherwise default to 8 hours (ideal sleep time)
    const goal = stats.goal || 8;
    const lastNightSleep = stats.latest || 0;
    const progress = (lastNightSleep / goal) * 100;
    
    return [
      {
        name: 'Progress',
        value: Math.min(progress, 100),
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



  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950">
        <p className="text-gray-600 dark:text-gray-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-white dark:bg-gray-950">
      {/* Main Content Area */}
      <main className="flex-1 p-8 overflow-auto bg-purple-50 dark:bg-gray-950 text-gray-900 dark:text-gray-50">
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
          </div>
        </div>

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
            {!stats.goal ? (
              <StatCard 
                label="Goal Achievement" 
                value="No Goal Set"
                sublabel="Set a goal to track progress"
                color="#94a3b8"
              />
            ) : (
              <StatCard 
                label="Goal Achievement" 
                value={stats.goalAchieved ? 'Achieved' : 'Not Met'}
                sublabel={`${stats.goal}h/night goal`}
                color={stats.goalAchieved ? '#10b981' : '#ef4444'}
              />
            )}
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

        

          {/* Sleep Quality Guide */}
          <InfoCard
            icon="😴"
            title="Ideal Sleep Hours & Quality"
            bgColor="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border border-purple-200 dark:border-purple-800"
            textColor="text-purple-900 dark:text-purple-200"
            items={[
              { label: '✅ Optimal (7-9 hours)', description: 'Ideal sleep range for most adults' },
              { label: '🔴 Bad (Below 7 hours)', description: 'Insufficient sleep - impacts health and performance' },
              { label: '🔵 Extended (9-10 hours)', description: 'Above ideal range - may indicate need for rest' },
              { label: '⚠️ Critical (Below 5 hours)', description: 'Severely insufficient - prioritize better sleep' }
            ]}
          />
        </div>

        {/* Manual Entry Section */}
        <div className="mb-8">
          <MetricManualEntrySection 
            metricType="sleep"
            selectedDate={selectedDate}
          />
        </div>

        
      </main>
    </div>
  );
}