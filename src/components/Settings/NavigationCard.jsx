'use client';

import { useRouter } from 'next/navigation';
import { ChevronRightIcon } from './SectionIcons';

export default function NavigationCard({ icon, title, description, href }) {
  const router = useRouter();

  return (
    <button
      onClick={() => router.push(href)}
      className="w-full flex items-center justify-between px-6 py-4 bg-slate-50 dark:bg-gray-800 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg border border-slate-200 dark:border-gray-700 transition-colors group"
    >
      <div className="flex items-center gap-3">
        <div className="text-blue-600 dark:text-blue-400">
          {icon}
        </div>
        <div className="text-left">
          <h4 className="font-semibold text-slate-800 dark:text-slate-100">{title}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p>
        </div>
      </div>
      <div className="text-slate-400 dark:text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
        <ChevronRightIcon />
      </div>
    </button>
  );
}
