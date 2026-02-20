export default function StatCard({ title, value, unit, color = 'blue' }) {
  const colorMap = {
    blue: 'text-blue-600',
    cyan: 'text-cyan-600',
    green: 'text-green-600',
    teal: 'text-teal-600'
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
      <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">{title}</p>
      <p className={`text-3xl font-bold ${colorMap[color]} mt-2`}>
        {value}
      </p>
      <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">{unit}</p>
    </div>
  );
}
