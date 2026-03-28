'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, AlertTriangle } from 'lucide-react';

export default function CriticalEventsWarningsWidget({ providerId }) {
  const router = useRouter();
  const [stats, setStats] = useState({ critical: 0, criticalPatients: 0, warnings: 0 });
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async (isInitial = false) => {
      try {
        if (isInitial) {
          setIsInitialLoading(true);
        }
        const response = await fetch(
          `/api/provider/dashboard-stats?providerId=${providerId}`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch dashboard stats');
        }

        const data = await response.json();
        setStats(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
        setError(err.message);
        setStats({ critical: 0, criticalPatients: 0, warnings: 0 });
      } finally {
        if (isInitial) {
          setIsInitialLoading(false);
        }
      }
    };

    if (providerId) {
      fetchStats(true);
      // Refresh every 60 seconds silently in the background
      const interval = setInterval(() => fetchStats(false), 60000);
      return () => clearInterval(interval);
    }
  }, [providerId]);

  const handleNavigateToCriticalEvents = () => {
    router.push('/provider/critical-events');
  };

  if (isInitialLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
        <p className="text-gray-600 dark:text-gray-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Critical Events Card */}
      <button
        onClick={handleNavigateToCriticalEvents}
        className="text-left bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-900/10 rounded-2xl border border-red-200 dark:border-red-800 p-6 hover:shadow-lg dark:hover:shadow-red-900/20 transition-all cursor-pointer group"
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-red-700 dark:text-red-300 mb-2">
              Critical Events
            </p>
            <p className="text-4xl font-bold text-red-600 dark:text-red-400 group-hover:scale-105 transition-transform origin-left">
              {stats.critical}
            </p>
            <p className="text-xs text-red-600 dark:text-red-400 mt-2">
              {stats.critical === 0
                ? 'No critical events'
                : `${stats.criticalPatients} patient${stats.criticalPatients !== 1 ? 's' : ''} need attention`}
            </p>
          </div>
          <div className="flex-shrink-0">
            <AlertCircle size={32} className="text-red-600 dark:text-red-400 group-hover:scale-110 transition-transform" />
          </div>
        </div>
      </button>

      {/* Warnings Card */}
      <button
        onClick={handleNavigateToCriticalEvents}
        className="text-left bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-900/10 rounded-2xl border border-orange-200 dark:border-orange-800 p-6 hover:shadow-lg dark:hover:shadow-orange-900/20 transition-all cursor-pointer group"
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-orange-700 dark:text-orange-300 mb-2">
              Warnings
            </p>
            <p className="text-4xl font-bold text-orange-600 dark:text-orange-400 group-hover:scale-105 transition-transform origin-left">
              {stats.warnings}
            </p>
            <p className="text-xs text-orange-600 dark:text-orange-400 mt-2">
              {stats.warnings === 0
                ? 'No warnings issued'
                : `${stats.warnings} warning${stats.warnings !== 1 ? 's' : ''} detected`}
            </p>
          </div>
          <div className="flex-shrink-0">
            <AlertTriangle size={32} className="text-orange-600 dark:text-orange-400 group-hover:scale-110 transition-transform" />
          </div>
        </div>
      </button>
    </div>
  );
}
