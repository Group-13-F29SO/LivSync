
import { GOAL_CATALOG } from '@/constants/goalCatalog';

const STREAK_METRICS = ['steps', 'calories', 'water', 'sleep'];

const getMetricInfo = (metricType) => {
  return GOAL_CATALOG.find((item) => item.metric_type === metricType);
};

export default function MetricSelector({ selectedMetric, onMetricChange }) {
  return (
    <div className="mb-8 flex gap-2 overflow-x-auto pb-2">
      {STREAK_METRICS.map((metricType) => {
        const metricInfo = getMetricInfo(metricType);
        return (
          <button
            key={metricType}
            onClick={() => onMetricChange(metricType)}
            className={`px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
              selectedMetric === metricType
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            {metricInfo?.title || metricType}
          </button>
        );
      })}
    </div>
  );
}
