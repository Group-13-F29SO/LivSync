'use client';

import { Settings, RotateCcw } from 'lucide-react';

export default function DashboardWidgetManager({
  isEditMode,
  onToggleEditMode,
  onResetToDefaults,
  visibleWidgetCount,
}) {
  return (
    <div className="flex items-center gap-2">
      {isEditMode && (
        <>
          <button
            onClick={onResetToDefaults}
            className="flex items-center gap-1 px-2 py-1 text-sm rounded font-medium bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-50 hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
            title="Reset all widgets to default layout and visibility"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
        </>
      )}

      <button
        onClick={onToggleEditMode}
        className={`flex items-center gap-1 px-2 py-1 text-sm rounded font-medium transition-all ${
          isEditMode
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-50 hover:bg-gray-300 dark:hover:bg-gray-600'
        }`}
      >
        <Settings className="w-3.5 h-3.5" />
        {isEditMode ? 'Done' : 'Customize'}
      </button>
    </div>
  );
}
