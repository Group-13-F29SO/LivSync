'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar/Navbar';
import { useAuth } from '@/hooks/useAuth';import { GOAL_CATALOG } from '@/constants/goalCatalog';

const STREAK_METRICS = ['steps', 'calories', 'water', 'sleep'];

const getMetricInfo = (metricType) => {
  return GOAL_CATALOG.find((item) => item.metric_type === metricType);
};
export default function StreaksPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  const [streakData, setStreakData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [metric, setMetric] = useState('steps');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    const fetchStreakData = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/biometrics/streaks?metric=${metric}&daysBack=365`,
          {
            cache: 'no-store',
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch streak data');
        }

        const data = await response.json();
        setStreakData(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching streak data:', err);
        setError(err.message || 'Failed to load streak data');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchStreakData();
    }
  }, [user, metric]);

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
        <div className="flex items-center justify-between mb-8">
          <div>
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mb-4"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back
            </button>
            <h1 className="inline-block text-3xl font-bold bg-gradient-to-br from-blue-600 via-purple-500 to-pink-400 bg-clip-text text-transparent">
              Streaks
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Track your consecutive days of goal achievements
            </p>
          </div>
        </div>

        {/* Metric Selector Tabs */}
        <div className="mb-8 flex gap-2 overflow-x-auto pb-2">
          {STREAK_METRICS.map((metricType) => {
            const metricInfo = getMetricInfo(metricType);
            return (
              <button
                key={metricType}
                onClick={() => setMetric(metricType)}
                className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                  metric === metricType
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                {metricInfo?.title || metricType}
              </button>
            );
          })}
        </div>

        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center p-8">
            <p className="text-gray-600 dark:text-gray-400">
              Loading streak data...
            </p>
          </div>
        ) : !streakData ? (
          <div className="p-8 bg-white dark:bg-gray-900 rounded-2xl shadow-sm text-center">
            <p className="text-gray-600 dark:text-gray-400">
              No streak data available
            </p>
          </div>
        ) : (
          <>
            {/* Current Streak Card */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Large Current Streak */}
              <div className="lg:col-span-1 bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-sm">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 mb-4">
                    <span className="text-3xl">🔥</span>
                  </div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
                    Current Streak
                  </h2>
                  <div className="flex items-baseline justify-center gap-2 mb-4">
                    <span className="text-5xl font-bold bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
                      {streakData.currentStreak}
                    </span>
                    <span className="text-xl font-medium text-gray-900 dark:text-gray-100">
                      days
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Keep it up!
                  </p>
                </div>
              </div>

              {/* Stats */}
              <div className="lg:col-span-2 grid grid-cols-2 gap-6">
                {/* Longest Streak */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30">
                      <span className="text-lg">👑</span>
                    </div>
                    <h3 className="font-bold text-gray-900 dark:text-gray-100">
                      Longest Streak
                    </h3>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
                      {streakData.longestStreak}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      days
                    </span>
                  </div>
                </div>

                {/* Goal Value */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30">
                      <span className="text-lg">🎯</span>
                    </div>
                    <h3 className="font-bold text-gray-900 dark:text-gray-100">
                      Daily Goal
                    </h3>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-green-600 dark:text-green-400">
                      {streakData.goalValue?.toLocaleString()}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {getMetricInfo(metric)?.unit || metric}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Streak History */}
            {streakData.streakHistory && streakData.streakHistory.length > 0 && (
              <div className="mt-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                  Streak History
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {streakData.streakHistory.map((streak, index) => (
                    <div
                      key={index}
                      className="bg-white dark:bg-gray-900 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-800"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                            {streak.length}
                          </span>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            days
                          </span>
                        </div>
                        {index === 0 && (
                          <span className="text-xs font-semibold px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full">
                            Latest
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        <p>
                          {new Date(streak.startDate).toLocaleDateString(
                            'en-US',
                            {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            }
                          )}{' '}
                          →{' '}
                          {new Date(streak.endDate).toLocaleDateString(
                            'en-US',
                            {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            }
                          )}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {streakData.streakHistory?.length === 0 && (
              <div className="mt-8 p-8 bg-white dark:bg-gray-900 rounded-2xl shadow-sm text-center">
                <p className="text-gray-600 dark:text-gray-400">
                  No streak history yet. Start achieving your {getMetricInfo(metric)?.title?.toLowerCase() || metric} goal to
                  build a streak!
                </p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
