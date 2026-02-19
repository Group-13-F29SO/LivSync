export default function StatCard({ label, value, subLabel, color = 'blue' }) {
  const colorClasses = {
    blue: 'text-blue-600',
    purple: 'text-purple-600',
    green: 'text-green-600',
    orange: 'text-orange-600'
  };

  const formatValue = () => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return value.toLocaleString();
    return String(value);
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
      <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">{label}</p>
      <p className={`text-3xl font-bold ${colorClasses[color]} mt-2`}>
        {formatValue()}
      </p>
      <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">{subLabel}</p>
    </div>
  );
}
