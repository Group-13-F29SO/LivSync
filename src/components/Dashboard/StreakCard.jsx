

const StreakCard = ({ currentStreak, targetMetric, message }) => {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer">
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

        {/* Streak Icon - Flame */}
        <div className="flex flex-col items-center justify-center">
          <svg className="w-20 h-20 text-orange-500 drop-shadow-lg" fill="currentColor" viewBox="0 0 24 24">
            <path d="M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67z" />
          </svg>
        </div>
      </div>

      {/* Footer */}
      <p className="mt-4 text-gray-600 dark:text-gray-400">
        {message} Goal: {targetMetric}
      </p>

      {/* Click indicator - hidden but shows on hover for accessibility */}
      <div className="mt-4 flex items-center gap-1 text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
        <span className="text-xs font-medium">View all streaks</span>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </div>
  );
};

export default StreakCard;
