'use client';

export default function StatsCard({ label, value, unit, color }) {
  const colorMap = {
    indigo: 'text-indigo-600 dark:text-indigo-400',
    red: 'text-red-600 dark:text-red-400',
    green: 'text-green-600 dark:text-green-400',
    purple: 'text-purple-600 dark:text-purple-400',
    yellow: 'text-yellow-600 dark:text-yellow-400'
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
      <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">{label}</p>
      <p className={`text-3xl font-bold ${colorMap[color] || colorMap.indigo} mt-2`}>
        {value}
      </p>
      <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">{unit}</p>
    </div>
  );
}
