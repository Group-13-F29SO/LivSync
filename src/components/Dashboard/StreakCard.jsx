import React from 'react';

const StreakCard = ({ currentStreak, targetMetric, message }) => {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-blue-100 dark:bg-blue-900/30 rounded-lg p-2.5">
          <svg 
            className="w-6 h-6 text-blue-600 dark:text-blue-400" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="6" />
            <circle cx="12" cy="12" r="2" />
          </svg>
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Current Streak</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">{targetMetric}</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-2">
          <span className="text-6xl font-bold bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
            {currentStreak}
          </span>
          <span className="text-2xl font-medium text-gray-900 dark:text-gray-100">days</span>
        </div>

        {/* Progress Graphic */}
        <div className="flex flex-col items-end">
          <svg className="w-24 h-16" viewBox="0 0 100 60" fill="none">
            <path
              d="M 5 55 Q 20 45 35 40 T 65 25 T 95 10"
              stroke="url(#blueGradient)"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
            />
            <defs>
              <linearGradient id="blueGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#60a5fa" />
                <stop offset="100%" stopColor="#818cf8" />
              </linearGradient>
            </defs>
            {/* Arrow */}
            <path
              d="M 95 10 L 90 8 L 92 13 Z"
              fill="#818cf8"
            />
          </svg>
        </div>
      </div>

      {/* Footer */}
      <p className="mt-4 text-gray-600 dark:text-gray-400">
        {message} Goal: {targetMetric}
      </p>
    </div>
  );
};

export default StreakCard;
