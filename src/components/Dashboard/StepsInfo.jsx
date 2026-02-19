export default function StepsInfo({ period }) {
  if (period === 'today') {
    return (
      <>
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg">
          <h3 className="font-semibold text-blue-900 dark:text-blue-200">Hourly Steps & Activity Information</h3>
          <ul className="mt-2 text-sm text-blue-800 dark:text-blue-300 space-y-1">
            <li>• <strong>Chart Breakdown:</strong> Each bar represents steps taken during that hour (12am-1am, 1am-2am, etc.)</li>
            <li>• <strong>6-Hour Intervals:</strong> The x-axis is labeled at 12am, 6am, 12pm, and 6pm for easy reference</li>
            <li>• <strong>Daily Goal:</strong> 10,000 steps per day for general health (~417 steps/hour average)</li>
            <li>• <strong>Activity Patterns:</strong> Step counts naturally vary by hour based on your daily schedule and routines</li>
            <li>• <strong>Peak Hours:</strong> Most people are more active during morning, afternoon, and early evening hours</li>
          </ul>
        </div>

        {/* Activity Levels */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-lg">
            <h4 className="font-semibold text-red-900 dark:text-red-200">Low Activity</h4>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-2">&lt; 300</p>
            <p className="text-sm text-red-600 dark:text-red-400 mt-1">steps/hour</p>
          </div>
          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 p-4 rounded-lg">
            <h4 className="font-semibold text-orange-900 dark:text-orange-200">Moderate Activity</h4>
            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-2">300-599</p>
            <p className="text-sm text-orange-600 dark:text-orange-400 mt-1">steps/hour</p>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4 rounded-lg">
            <h4 className="font-semibold text-green-900 dark:text-green-200">Very Active</h4>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-2">≥ 600</p>
            <p className="text-sm text-green-600 dark:text-green-400 mt-1">steps/hour</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg">
      <h3 className="font-semibold text-blue-900 dark:text-blue-200">Daily Steps Summary</h3>
      <ul className="mt-2 text-sm text-blue-800 dark:text-blue-300 space-y-1">
        <li>• <strong>Chart Shows:</strong> Total steps per day for the selected time period</li>
        <li>• <strong>Daily Goal:</strong> 10,000 steps per day is the recommended daily target</li>
        <li>• <strong>Trend Analysis:</strong> Monitor your activity trends over time to improve fitness</li>
        <li>• <strong>Missing Days:</strong> Days without data are displayed as gaps in the chart</li>
        <li>• <strong>Average Calculation:</strong> Daily average is calculated from all days in the period</li>
      </ul>
    </div>
  );
}
