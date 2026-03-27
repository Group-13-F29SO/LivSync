'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import MetricSelector from '@/components/Streaks/MetricSelector';
import StreakContent from '@/components/Streaks/StreakContent';
import StreakPageHeader from '@/components/Streaks/StreakPageHeader';
import { useAuth } from '@/hooks/useAuth';

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
    // Only allow patients to access this page
    if (!isLoading && user && user.userType === 'provider') {
      router.push('/provider');
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
      {/* Main Content Area */}
      <main className="flex-1 p-8 overflow-auto bg-blue-50 dark:bg-gray-950 text-gray-900 dark:text-gray-50">
        <StreakPageHeader />

        <MetricSelector selectedMetric={metric} onMetricChange={setMetric} />

        <StreakContent
          loading={loading}
          error={error}
          streakData={streakData}
          metric={metric}
        />
      </main>
    </div>
  );
}
