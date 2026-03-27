'use client';

import { Settings, RotateCcw } from 'lucide-react';

export default function DashboardWidgetManager({
  isEditMode,
  onToggleEditMode,
  onResetToDefaults,
  visibleWidgetCount,
}) {
  return (
    <div className="flex items-center gap-3">
      {isEditMode && (
        <>
          <button
            onClick={onResetToDefaults}
            className="flex items-center gap-2 px-4 py-2 text-base rounded-lg font-medium bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-50 hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
            title="Reset all widgets to default layout and visibility"
          >
            <RotateCcw className="w-4 h-4" />
            Reset Layout
          </button>
        </>
      )}

      <button
        onClick={onToggleEditMode}
        className={`flex items-center gap-2 px-4 py-2 text-base rounded-lg font-medium transition-all ${
          isEditMode
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-50 hover:bg-gray-300 dark:hover:bg-gray-600'
        }`}
      >
        <Settings className="w-4 h-4" />
        {isEditMode ? 'Done Editing' : 'Customize Dashboard'}
      </button>
    </div>
  );
}
