export default function CaloriesStats({ stats, period, activityLevel }) {
  if (!stats) {
    return null;
  }

  return (
    <div className={`grid gap-4 mb-8 ${period === 'today' ? 'grid-cols-1 md:grid-cols-5' : 'grid-cols-1 md:grid-cols-4'}`}>
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
          Total Burned
        </p>
        <p className={`text-3xl font-bold mt-2 text-orange-600`}>
          {(stats.total || 0).toLocaleString()}
        </p>
        <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">kcal</p>
        {period === 'today' && activityLevel && (
          <p className={`text-sm font-medium ${activityLevel.color} mt-2`}>
            {activityLevel.level}
          </p>
        )}
      </div>
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
          {period === 'today' ? 'Hourly Average' : 'Daily Average'}
        </p>
        <p className="text-3xl font-bold text-red-600 mt-2">
          {stats.average.toLocaleString()}
        </p>
        <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">
          {period === 'today' ? 'kcal/hour' : 'kcal/day'}
        </p>
      </div>
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Peak</p>
        <p className="text-3xl font-bold text-green-600 mt-2">
          {stats.max.toLocaleString()}
        </p>
        <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">kcal</p>
      </div>
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
          {period === 'today' ? 'Min' : 'Total Days'}
        </p>
        <p className="text-3xl font-bold text-purple-600 mt-2">
          {period === 'today' ? stats.min.toLocaleString() : stats.daysWithData || 0}
        </p>
        <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">
          {period === 'today' ? 'kcal' : 'days'}
        </p>
      </div>
      {period === 'today' && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
          <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Goal Achievement</p>
          <p className={`text-3xl font-bold mt-2 ${stats.goalAchieved ? 'text-green-600' : 'text-red-600'}`}>
            {stats.goalAchieved ? 'Achieved' : 'Not Met'}
          </p>
          <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">
            {stats.goal} kcal/day goal
          </p>
        </div>
      )}
    </div>
  );
}
