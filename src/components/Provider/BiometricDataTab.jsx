'use client';

import { useState, useEffect } from 'react';
import { Heart, Calendar } from 'lucide-react';
import HeartRateChart from './HeartRateChart';

export default function BiometricDataTab() {
  const [startDate, setStartDate] = useState('2026-02-28');
  const [endDate, setEndDate] = useState('2026-03-13');

  return (
    <div>
      {/* Date Range Picker */}
      <div className="flex items-center gap-4 mb-8 bg-gray-100 dark:bg-gray-800 rounded-2xl p-4">
        <div className="flex-1 relative">
          <Calendar className="absolute left-3 top-3 text-gray-400" size={18} />
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-50 focus:outline-none focus:border-blue-500"
          />
        </div>

        <span className="text-gray-400 text-2xl">→</span>

        <div className="flex-1 relative">
          <Calendar className="absolute left-3 top-3 text-gray-400" size={18} />
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-50 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Heart Rate Chart Card */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex items-center justify-center w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full">
            <Heart size={20} className="text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
            Heart Rate
          </h3>
          <span className="text-gray-500 dark:text-gray-400 text-sm ml-auto">
            (bpm)
          </span>
        </div>

        {/* Chart */}
        <HeartRateChart startDate={startDate} endDate={endDate} />
      </div>

      {/* Placeholder for additional charts */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 text-center text-gray-500 dark:text-gray-400">
          <p>Blood Glucose Chart</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 text-center text-gray-500 dark:text-gray-400">
          <p>Sleep Chart</p>
        </div>
      </div>
    </div>
  );
}
