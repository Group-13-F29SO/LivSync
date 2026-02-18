'use client';

export default function StatsCard({ label, value, unit, color }) {
  const colorClasses = {
    blue: 'text-blue-600',
    red: 'text-red-600',
    green: 'text-green-600',
    purple: 'text-purple-600'
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
      <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">{label}</p>
      <p className={`text-3xl font-bold mt-2 ${colorClasses[color] || colorClasses.blue}`}>
        {value}
      </p>
      <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">{unit}</p>
    </div>
  );
}
