'use client';

export default function PeriodSelector({ period, onPeriodChange }) {
  const periodOptions = [
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' }
  ];

  return (
    <div className="flex gap-2 mb-8">
      {periodOptions.map((option) => (
        <button
          key={option.value}
          onClick={() => onPeriodChange(option.value)}
          className={`px-4 py-2 font-medium rounded-lg transition-colors ${
            period === option.value
              ? 'bg-indigo-600 text-white'
              : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
