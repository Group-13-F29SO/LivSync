'use client';

export default function HeartRateInfo() {
  return (
    <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg">
      <h3 className="font-semibold text-blue-900 dark:text-blue-200">Heart Rate Information</h3>
      <ul className="mt-2 text-sm text-blue-800 dark:text-blue-300 space-y-1">
        <li>• <strong>Resting Heart Rate:</strong> 60-100 bpm is considered normal</li>
        <li>• <strong>Athletic Heart Rate:</strong> 40-60 bpm indicates good cardiovascular fitness</li>
        <li>• <strong>Maximum Heart Rate:</strong> Estimated at 220 minus your age</li>
        <li>• <strong>Target Zone:</strong> 50-85% of maximum heart rate for moderate to vigorous exercise</li>
      </ul>
    </div>
  );
}
