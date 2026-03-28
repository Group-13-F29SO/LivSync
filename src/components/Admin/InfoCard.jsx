'use client';

export default function InfoCard({ label, value, icon: Icon, color = 'blue' }) {
  const colorClasses = {
    blue: 'text-blue-600 dark:text-blue-400',
    purple: 'text-purple-600 dark:text-purple-400',
    green: 'text-green-600 dark:text-green-400',
    amber: 'text-amber-600 dark:text-amber-400',
  };

  return (
    <div className="p-3 bg-gray-50/50 dark:bg-gray-800/30 rounded-lg">
      <p className={`text-xs ${colorClasses[color]} uppercase tracking-wide font-semibold flex items-center gap-1`}>
        {Icon && <Icon className="w-3.5 h-3.5" />}
        {label}
      </p>
      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mt-1">
        {value || 'N/A'}
      </p>
    </div>
  );
}
