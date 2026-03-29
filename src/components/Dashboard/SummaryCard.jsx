

const SummaryCard = ({ summaryData }) => {
  const metrics = [
    { label: 'Steps Taken', value: summaryData?.steps?.toLocaleString() || '0', unit: '', key: 'steps' },
    { label: 'Calories Burned', value: summaryData?.calories?.toLocaleString() || '0', unit: 'kcal', key: 'calories' },
    { label: 'Sleep Duration', value: summaryData?.sleep || '0', unit: 'hrs', key: 'sleep' },
    { label: 'Hydration', value: summaryData?.hydration || '0', unit: 'cups', key: 'hydration' },
  ];

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm">
      {/* Title */}
      <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6">Today's Summary</h2>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {metrics.map((metric) => (
          <div key={metric.key} className="text-center">
            <div className="flex items-center justify-center gap-1 mb-2">
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                {metric.value}
              </p>
              {metric.unit && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {metric.unit}
                </p>
              )}
            </div>
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