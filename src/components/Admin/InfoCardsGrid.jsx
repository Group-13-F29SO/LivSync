'use client';

export default function InfoCardsGrid({ title, icon: Icon, children, color = 'blue' }) {
  const colorClasses = {
    blue: {
      icon: 'bg-blue-100/70 dark:bg-blue-900/40',
      iconText: 'text-blue-600 dark:text-blue-400',
      border: 'border-blue-100 dark:border-blue-900/50',
    },
    purple: {
      icon: 'bg-purple-100/70 dark:bg-purple-900/40',
      iconText: 'text-purple-600 dark:text-purple-400',
      border: 'border-purple-100 dark:border-purple-900/50',
    },
    amber: {
      icon: 'bg-amber-100/70 dark:bg-amber-900/40',
      iconText: 'text-amber-600 dark:text-amber-400',
      border: 'border-amber-100 dark:border-amber-900/50',
    },
  };

  const colors = colorClasses[color];

  return (
    <div className={`bg-white dark:bg-gray-900/50 rounded-lg shadow-sm p-6 border ${colors.border}`}>
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
        <div className={`p-2 ${colors.icon} rounded-lg`}>
          <Icon className={`w-5 h-5 ${colors.iconText}`} />
        </div>
        {title}
      </h2>
      <div className="space-y-3">
        {children}
      </div>
    </div>
  );
}
