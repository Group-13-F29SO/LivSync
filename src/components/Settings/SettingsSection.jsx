'use client';

export default function SettingsSection({ icon, title, children }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Section Header */}
      <div className="px-6 py-4">
        <div className="flex items-center gap-4 pb-4">
          <div className="text-blue-600 flex-shrink-0">
            {icon}
          </div>
          <h3 className="text-lg font-bold text-slate-800">{title}</h3>
        </div>
        <div className="border-t border-slate-200"></div>
      </div>

      {/* Section Content */}
      <div className="px-6 py-6">
        {children}
      </div>
    </div>
  );
}
