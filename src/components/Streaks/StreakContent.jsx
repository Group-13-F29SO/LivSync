
import StreakStatsCard from './StreakStatsCard';
import { GOAL_CATALOG } from '@/constants/goalCatalog';

const getMetricInfo = (metricType) => {
  return GOAL_CATALOG.find((item) => item.metric_type === metricType);
};

export default function StreakContent({ loading, error, streakData, metric }) {
  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400">
        {error}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-gray-600 dark:text-gray-400">
          Loading streak data...
        </p>
      </div>
    );
  }

  if (!streakData) {
    return (
      <div className="p-8 bg-white dark:bg-gray-900 rounded-2xl shadow-sm text-center">
        <p className="text-gray-600 dark:text-gray-400">
          No streak data available
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <StreakStatsCard
        type="current"
        value={streakData.currentStreak}
        metric={metric}
        unit="days"
      />
      <StreakStatsCard
        type="goal"
        value={streakData.goalValue}
        metric={metric}
        unit={getMetricInfo(metric)?.unit || metric}
      />
    </div>
  );
}
