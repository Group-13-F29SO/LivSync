import React from 'react';

const SummaryCard = ({ summaryData }) => {
  const metrics = [
    { label: 'Steps Taken', value: summaryData.steps?.toLocaleString() || '0', key: 'steps' },
    { label: 'Calories Burned', value: summaryData.calories?.toLocaleString() || '0', key: 'calories' },
    { label: 'Sleep Duration', value: summaryData.sleep || '0h', key: 'sleep' },
    { label: 'Hydration Goal', value: summaryData.hydration || '0/8', key: 'hydration' },
  ];

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm">
      {/* Title */}
      <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6">Today's Summary</h2>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {metrics.map((metric) => (
          <div key={metric.key} className="text-center">
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">
              {metric.value}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {metric.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SummaryCard;
