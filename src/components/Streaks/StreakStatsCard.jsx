import { GOAL_CATALOG } from '@/constants/goalCatalog';

const getMetricInfo = (metricType) => {
  return GOAL_CATALOG.find((item) => item.metric_type === metricType);
};

export default function StreakStatsCard({
  type, // 'current' or 'goal'
  value,
  metric,
  unit,
}) {
  const isCurrent = type === 'current';

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 shadow-sm">
      <div className="text-center">
        <div
          className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
            isCurrent
              ? 'bg-blue-100 dark:bg-blue-900/30'
              : 'bg-green-100 dark:bg-green-900/30'
          }`}
        >
          <span className="text-3xl">{isCurrent ? '🔥' : '🎯'}</span>
        </div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
          {isCurrent ? 'Current Streak' : 'Daily Goal'}
        </h3>
        <div className="flex items-baseline justify-center gap-2 mb-4">
          <span
            className={`text-5xl font-bold bg-clip-text text-transparent ${
              isCurrent
                ? 'bg-gradient-to-r from-indigo-500 to-purple-500'
                : 'bg-gradient-to-r from-green-500 to-emerald-500'
            }`}
          >
            {typeof value === 'number' ? value.toLocaleString() : value}
          </span>
          <span className="text-xl font-medium text-gray-900 dark:text-gray-100">
            {unit}
          </span>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {isCurrent ? 'Keep it up!' : `for ${getMetricInfo(metric)?.title?.toLowerCase() || metric}`}
        </p>
      </div>
    </div>
  );
}
