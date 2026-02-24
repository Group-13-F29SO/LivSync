'use client';

import { useEffect, useState } from 'react';
import { FlameIcon } from '../Icons/GoalIcons';

export default function GoalCard({
  title,
  icon: Icon,
  streak,
  currentValue,
  targetValue,
  unit,
  frequency = 'daily',
  iconBgColor = 'bg-indigo-100',
  iconColor = 'text-indigo-600',
  onUpdateTarget,
}) {
  const [newTarget, setNewTarget] = useState(String(targetValue ?? ''));

  useEffect(() => {
    setNewTarget(String(targetValue ?? ''));
  }, [targetValue]);

  const safeTarget = Number(targetValue) || 1;
  const safeCurrent = Number(currentValue) || 0;
  const percentage = Math.min((safeCurrent / safeTarget) * 100, 100).toFixed(0);

  const handleUpdate = async () => {
    const next = Number(newTarget);
    if (!Number.isFinite(next) || next <= 0) return;
    if (typeof onUpdateTarget === 'function') await onUpdateTarget(next);
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-slate-100 dark:border-gray-800 shadow-sm dark:shadow-lg p-6">
      {/* Header Section */}
      <div className="flex items-start gap-3 mb-6">
        <div className={`${iconBgColor} dark:bg-opacity-20 rounded-lg p-3 flex items-center justify-center`}>
          {Icon ? <Icon className={`w-5 h-5 ${iconColor}`} /> : null}
        </div>

        <div className="flex-1">
          <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">{title}</h3>
          <div className="flex items-center gap-1 mt-1">
            <FlameIcon className="w-4 h-4 text-orange-500" />
            <span className="text-sm text-gray-500 dark:text-gray-400">{Number(streak) || 0} day streak</span>
          </div>
        </div>
      </div>

      {/* Progress Display */}
      <div className="mb-4">
        <div className="flex items-baseline gap-2">
          <span className="text-5xl font-bold bg-gradient-to-br from-blue-600 via-purple-500 to-pink-400 bg-clip-text text-transparent">
            {safeCurrent}
          </span>
          <span className="text-xl text-gray-400 dark:text-gray-500">/ {safeTarget} {unit}</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-2">
        <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2.5">
          <div
            className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2.5 rounded-full transition-all duration-300"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <div className="text-right mt-1">
          <span className="text-xs text-gray-500 dark:text-gray-400">{percentage}% complete</span>
        </div>
      </div>

      {/* Input & Action Area */}
      <div className="mt-6 pt-4 border-t border-slate-100 dark:border-gray-800">
        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 block">
          {frequency === 'weekly' ? 'Weekly Target' : 'Daily Target'}
        </label>

        <div className="flex gap-2">
          <input
            type="number"
            value={newTarget}
            onChange={(e) => setNewTarget(e.target.value)}
            className="flex-1 px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          <button
            onClick={handleUpdate}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium text-sm rounded-lg transition-colors"
          >
            Update
          </button>
        </div>
      </div>
    </div>
  );
}