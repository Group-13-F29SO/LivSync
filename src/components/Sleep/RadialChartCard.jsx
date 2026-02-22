'use client';

import { ResponsiveContainer, RadialBarChart, RadialBar, PolarAngleAxis } from 'recharts';

export default function RadialChartCard({ 
  dataLoading, 
  error, 
  stats, 
  selectedDate, 
  RECOMMENDED_MIN, 
  getRadialData 
}) {
  if (error) {
    return (
      <div className="text-red-600 dark:text-red-400 p-4 bg-red-50 dark:bg-red-900/20 rounded">
        Error: {error}
      </div>
    );
  }

  if (dataLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-600 dark:text-gray-400">Loading sleep data...</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-600 dark:text-gray-400">No sleep data available yet.</p>
      </div>
    );
  }

  if (stats.latest === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400 text-lg mb-2">No data synced for this date</p>
          <p className="text-gray-500 dark:text-gray-500 text-sm">Data will appear here once your device syncs sleep information</p>
        </div>
      </div>
    );
  }

  const today = new Date().toISOString().split('T')[0];
  const chartTitle = selectedDate === today ? "Last Night's Sleep" : 'Selected Date Sleep';

  return (
    <div>
      <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
        {chartTitle}
      </h2>
      <ResponsiveContainer width="100%" height={300}>
        <RadialBarChart
          cx="50%"
          cy="50%"
          innerRadius="60%"
          outerRadius="90%"
          data={getRadialData()}
          startAngle={90}
          endAngle={-270}
        >
          <PolarAngleAxis
            type="number"
            domain={[0, 100]}
            angleAxisId={0}
            tick={false}
          />
          <RadialBar
            background
            dataKey="value"
            cornerRadius={10}
            fill={getRadialData()[0]?.fill}
          />
          <text
            x="50%"
            y="45%"
            textAnchor="middle"
            dominantBaseline="middle"
            className="text-5xl font-bold fill-gray-900 dark:fill-gray-100"
          >
            {stats.latest}
          </text>
          <text
            x="50%"
            y="55%"
            textAnchor="middle"
            dominantBaseline="middle"
            className="text-lg fill-gray-600 dark:fill-gray-400"
          >
            of {stats.recommendedMax}h goal
          </text>
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="text-center mt-4">
        <p className="text-2xl font-bold" style={{ color: getRadialData()[0]?.fill }}>
          {stats.currentProgress}%
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          {stats.latest >= RECOMMENDED_MIN 
            ? '✨ Good sleep!' 
            : `${(RECOMMENDED_MIN - stats.latest).toFixed(1)}h short of optimal`
          }
        </p>
      </div>
    </div>
  );
}
