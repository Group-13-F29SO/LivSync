'use client';

export default function SettingsSection({ icon, title, children }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm dark:shadow-lg border border-slate-200 dark:border-gray-800 overflow-hidden">
      {/* Section Header */}
      <div className="px-6 py-4">
        <div className="flex items-center gap-4 pb-4">
          <div className="text-blue-600 dark:text-blue-400 flex-shrink-0">
            {icon}
          </div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">{title}</h3>
        </div>
        <div className="border-t border-slate-200 dark:border-gray-800"></div>
      </div>

      {/* Section Content */}
      <div className="px-6 py-6">
        {children}
      </div>
    </div>
  );
}
