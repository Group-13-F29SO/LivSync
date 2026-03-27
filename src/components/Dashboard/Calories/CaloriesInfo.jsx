export default function CaloriesInfo() {
  return (
    <>
      {/* Calorie Information */}

      {/* Activity Level Categories */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-lg">
          <h4 className="font-semibold text-red-900 dark:text-red-200">Sedentary</h4>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-2">&lt; 1,500</p>
          <p className="text-sm text-red-700 dark:text-red-300 mt-1">kcal/day</p>
        </div>
        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 p-4 rounded-lg">
          <h4 className="font-semibold text-orange-900 dark:text-orange-200">Lightly Active</h4>
          <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-2">1,500-2,000</p>
          <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">kcal/day</p>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg">
          <h4 className="font-semibold text-blue-900 dark:text-blue-200">Moderately Active</h4>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-2">2,000-2,500</p>
          <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">kcal/day</p>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4 rounded-lg">
          <h4 className="font-semibold text-green-900 dark:text-green-200">Very Active</h4>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-2">2,500-3,000</p>
          <p className="text-sm text-green-700 dark:text-green-300 mt-1">kcal/day</p>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 p-4 rounded-lg">
          <h4 className="font-semibold text-purple-900 dark:text-purple-200">Extremely Active</h4>
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-2">≥ 3,000</p>
          <p className="text-sm text-purple-700 dark:text-purple-300 mt-1">kcal/day</p>
        </div>
      </div>
    </>
  );
}
