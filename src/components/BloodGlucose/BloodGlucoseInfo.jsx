'use client';

export default function BloodGlucoseInfo() {
  return (
    <>
      {/* Additional Info */}
      <div className="mt-8 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 p-4 rounded-lg">
        <h3 className="font-semibold text-indigo-900 dark:text-indigo-200">Blood Glucose Information</h3>
        <ul className="mt-2 text-sm text-indigo-800 dark:text-indigo-300 space-y-1">
          <li>• <strong>Normal Fasting:</strong> 70-100 mg/dL (before meals)</li>
          <li>• <strong>Normal Post-Meal:</strong> Less than 140 mg/dL (2 hours after eating)</li>
          <li>• <strong>Prediabetes:</strong> 100-125 mg/dL (fasting)</li>
          <li>• <strong>Diabetes:</strong> 126 mg/dL or higher (fasting) on two separate tests</li>
          <li>• <strong>Hypoglycemia:</strong> Below 70 mg/dL - seek immediate attention if symptoms occur</li>
        </ul>
      </div>

      {/* Health Ranges */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4 rounded-lg">
          <h4 className="font-semibold text-green-900 dark:text-green-200">Normal Range</h4>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-2">70-140</p>
          <p className="text-sm text-green-700 dark:text-green-300 mt-1">mg/dL</p>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-4 rounded-lg">
          <h4 className="font-semibold text-yellow-900 dark:text-yellow-200">Low (Hypoglycemia)</h4>
          <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-2">&lt; 70</p>
          <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">mg/dL</p>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-lg">
          <h4 className="font-semibold text-red-900 dark:text-red-200">High (Hyperglycemia)</h4>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-2">&gt; 140</p>
          <p className="text-sm text-red-700 dark:text-red-300 mt-1">mg/dL (post-meal)</p>
        </div>
      </div>
    </>
  );
}
