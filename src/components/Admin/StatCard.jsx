'use client';

import { useRouter } from 'next/navigation';

export default function StatCard({ title, value, icon: Icon, onClick, color = 'blue', loading = false }) {
  const router = useRouter();

  const colorClasses = {
    blue: {
      bg: 'bg-blue-100 dark:bg-blue-900',
      text: 'text-blue-600 dark:text-blue-400',
      hover: 'hover:border-blue-400 dark:hover:border-blue-500',
    },
    purple: {
      bg: 'bg-purple-100 dark:bg-purple-900',
      text: 'text-purple-600 dark:text-purple-400',
      hover: 'hover:border-purple-400 dark:hover:border-purple-500',
    },
    amber: {
      bg: 'bg-amber-100 dark:bg-amber-900',
      text: 'text-amber-600 dark:text-amber-400',
      hover: 'hover:border-amber-400 dark:hover:border-amber-500',
    },
  };

  const colors = colorClasses[color];

  const handleClick = () => {
    if (onClick) {
      typeof onClick === 'string' ? router.push(onClick) : onClick();
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`bg-white dark:bg-gray-900 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-800 ${colors.hover} transition-all duration-300 text-left disabled:cursor-not-allowed disabled:opacity-50`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{loading ? '...' : value}</p>
        </div>
        <div className={`flex items-center justify-center w-12 h-12 ${colors.bg} rounded-lg`}>
          <Icon className={`w-6 h-6 ${colors.text}`} />
        </div>
      </div>
    </button>
  );
}
