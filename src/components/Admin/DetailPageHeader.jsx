'use client';

import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';

export default function DetailPageHeader({ title, subtitle, icon: Icon, gradient = true }) {
  const router = useRouter();

  const gradientClass = gradient
    ? 'bg-gradient-to-r from-blue-500/80 to-purple-500/80 dark:from-blue-700/70 dark:to-purple-700/70'
    : 'bg-white dark:bg-gray-900';

  const borderClass = gradient
    ? 'border-blue-200 dark:border-blue-700/50'
    : 'border-gray-200 dark:border-gray-800';

  const iconBgClass = gradient
    ? 'bg-white/20 dark:bg-black/30'
    : 'bg-blue-100 dark:bg-blue-900';

  const textColorClass = gradient ? 'text-white' : 'text-gray-900 dark:text-gray-100';
  const subtitleClass = gradient ? 'text-blue-100' : 'text-gray-600 dark:text-gray-400';
  const buttonHoverClass = gradient
    ? 'hover:bg-white/20 dark:hover:bg-black/20'
    : 'hover:bg-gray-100 dark:hover:bg-gray-800';

  return (
    <header className={`${gradientClass} shadow-md border-b ${borderClass}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className={`p-2 ${buttonHoverClass} rounded-lg transition-colors`}
            aria-label="Go back"
          >
            <ChevronLeft className={`w-6 h-6 ${gradient ? 'text-white' : 'text-gray-600 dark:text-gray-400'}`} />
          </button>
          <div className="flex items-center gap-3">
            <div className={`p-3 ${iconBgClass} rounded-lg`}>
              <Icon className={`w-6 h-6 ${gradient ? 'text-white' : 'text-blue-600 dark:text-blue-400'}`} />
            </div>
            <div>
              <h1 className={`text-3xl font-bold ${textColorClass}`}>
                {title}
              </h1>
              <p className={`text-sm ${subtitleClass}`}>{subtitle}</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
