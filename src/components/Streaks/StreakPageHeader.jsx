import React from 'react';
import { useRouter } from 'next/navigation';

export default function StreakPageHeader() {
  const router = useRouter();

  return (
    <div className="flex items-center justify-between mb-8">
      <div>
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mb-4"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back
        </button>
        <h1 className="inline-block text-3xl font-bold bg-gradient-to-br from-blue-600 via-purple-500 to-pink-400 bg-clip-text text-transparent">
          Streaks
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Track your consecutive days of goal achievements
        </p>
      </div>
    </div>
  );
}
