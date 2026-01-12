'use client';

import { useState } from 'react';
import { FlameIcon } from '../Icons/GoalIcons';

export default function GoalCard({ 
  title, 
  icon: Icon, 
  streak, 
  currentValue, 
  targetValue, 
  unit,
  iconBgColor = 'bg-indigo-100',
  iconColor = 'text-indigo-600'
}) {
  const [newTarget, setNewTarget] = useState(targetValue);
  const percentage = Math.min((currentValue / targetValue) * 100, 100).toFixed(0);

  const handleUpdate = () => {
    // TODO: Add API call to update target value
    console.log('Updating target to:', newTarget);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
      {/* Header Section */}
      <div className="flex items-start gap-3 mb-6">
        {/* Icon Container */}
        <div className={`${iconBgColor} rounded-lg p-3 flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        
        {/* Title and Streak */}
        <div className="flex-1">
          <h3 className="font-bold text-slate-800 text-lg">{title}</h3>
          <div className="flex items-center gap-1 mt-1">
            <FlameIcon className="w-4 h-4 text-orange-500" />
            <span className="text-sm text-gray-500">{streak} day streak</span>
          </div>
        </div>
      </div>

      {/* Progress Display */}
      <div className="mb-4">
        <div className="flex items-baseline gap-2">
          <span className="text-5xl font-bold bg-gradient-to-br from-blue-600 via-purple-500 to-pink-400 bg-clip-text text-transparent">
            {currentValue}
          </span>
          <span className="text-xl text-gray-400">/ {targetValue} {unit}</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-2">
        <div className="w-full bg-gray-100 rounded-full h-2.5">
          <div 
            className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2.5 rounded-full transition-all duration-300"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <div className="text-right mt-1">
          <span className="text-xs text-gray-500">{percentage}% complete</span>
        </div>
      </div>

      {/* Input & Action Area */}
      <div className="mt-6 pt-4 border-t border-slate-100">
        <label className="text-xs font-bold text-slate-700 mb-2 block">
          Daily Target
        </label>
        <div className="flex gap-2">
          <input
            type="number"
            value={newTarget}
            onChange={(e) => setNewTarget(e.target.value)}
            className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder={targetValue}
          />
          <button
            onClick={handleUpdate}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium text-sm rounded-lg transition-colors"
          >
            Update
          </button>
        </div>
      </div>
    </div>
  );
}
