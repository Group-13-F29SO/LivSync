export default function CaloriesInfo() {
  return (
    <>
      {/* Calorie Information */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 p-6 rounded-lg">
          <h3 className="font-semibold text-orange-900 dark:text-orange-200 text-lg mb-3">🔥 Calorie Burn Facts</h3>
          <ul className="space-y-2 text-sm text-orange-800 dark:text-orange-300">
            <li>• <strong>Basal Metabolic Rate (BMR):</strong> Calories burned at rest (typically 1,200-1,800 kcal/day)</li>
            <li>• <strong>Physical Activity:</strong> Exercise and movement increase calorie expenditure</li>
            <li>• <strong>Thermic Effect:</strong> Digesting food burns ~10% of consumed calories</li>
            <li>• <strong>3,500 Rule:</strong> ~3,500 kcal deficit needed to lose 1 pound of fat</li>
            <li>• <strong>Muscle Mass:</strong> More muscle = higher resting metabolism</li>
          </ul>
        </div>

        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-6 rounded-lg">
          <h3 className="font-semibold text-red-900 dark:text-red-200 text-lg mb-3">💪 Boost Calorie Burn</h3>
          <ul className="space-y-2 text-sm text-red-800 dark:text-red-300">
            <li>• <strong>Increase Intensity:</strong> High-intensity interval training (HIIT) burns more calories</li>
            <li>• <strong>Build Muscle:</strong> Strength training increases metabolic rate</li>
            <li>• <strong>Stay Active:</strong> Take stairs, walk more, reduce sitting time</li>
            <li>• <strong>Hydrate:</strong> Drinking water temporarily boosts metabolism</li>
            <li>• <strong>Sleep Well:</strong> Poor sleep can slow metabolism and reduce calorie burn</li>
          </ul>
        </div>
      </div>

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

      {/* Additional Info */}
      <div className="mt-6 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 border border-orange-200 dark:border-orange-800 p-4 rounded-lg">
        <h3 className="font-semibold text-orange-900 dark:text-orange-200">Calorie Balance & Weight Management</h3>
        <div className="mt-2 text-sm text-orange-800 dark:text-orange-300 space-y-1">
          <p>• <strong>Weight Loss:</strong> Burn more calories than you consume (calorie deficit)</p>
          <p>• <strong>Weight Gain:</strong> Consume more calories than you burn (calorie surplus)</p>
          <p>• <strong>Maintenance:</strong> Balance calorie intake with expenditure</p>
          <p>• <strong>Factors:</strong> Age, gender, weight, height, and activity level affect daily calorie needs</p>
          <p>• <strong>Healthy Rate:</strong> Safe weight loss is 1-2 pounds per week (500-1,000 kcal deficit/day)</p>
        </div>
      </div>
    </>
  );
}
