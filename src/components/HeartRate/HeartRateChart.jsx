'use client';

import {
  ResponsiveContainer,
  AreaChart,
  BarChart,
  ComposedChart,
  Area,
  Bar,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend
} from 'recharts';
import RangeBarChart from './RangeBarChart';

export default function HeartRateChart({ period, chartData, dataLoading, error, chartType = 'area', useRangeBar = false }) {
  const getPeriodLabel = () => {
    switch (period) {
      case 'today':
        return ' - Today';
      case '7days':
        return ' - Last 7 Days';
      case '30days':
        return ' - Last 30 Days';
      case 'all':
        return ' - All Available Data';
      default:
        return '';
    }
  };

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
        <div className="text-red-600 dark:text-red-400 p-4 bg-red-50 dark:bg-red-900/20 rounded">
          Error: {error}
        </div>
      </div>
    );
  }

  if (dataLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
        <div className="flex items-center justify-center h-96">
          <p className="text-gray-600 dark:text-gray-400">Loading heart rate data...</p>
        </div>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
        <div className="flex items-center justify-center h-96">
          <p className="text-gray-600 dark:text-gray-400">No heart rate data available yet.</p>
        </div>
      </div>
    );
  }

  // Use special range bar chart for 7-day view
  if (useRangeBar) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
        <RangeBarChart chartData={chartData} period={period} />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
      <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
        Heart Rate Over Time
        {getPeriodLabel()}
      </h2>
      <ResponsiveContainer width="100%" height={400}>
        {chartType === 'bar' ? (
          <ComposedChart
            data={chartData}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="#e5e7eb"
              dark="#374151"
            />
            <XAxis 
              dataKey="timestamp" 
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
              label={{ value: 'BPM', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: '#1f2937',
                border: '1px solid #3b82f6',
                borderRadius: '8px',
                color: '#fff'
              }}
              formatter={(value) => `${value} bpm`}
              labelFormatter={(label) => `${label}`}
            />
            <Legend />
            {/* Bar showing maximum recorded in the period */}
            <Bar 
              dataKey="max" 
              fill="#ef4444"
              name="Maximum BPM"
              radius={[8, 8, 0, 0]}
            />
            {/* Bar showing minimum recorded in the period */}
            <Bar 
              dataKey="min" 
              fill="#a3e635"
              name="Minimum BPM"
              radius={[8, 8, 0, 0]}
            />
            {/* Line showing average over the period */}
            <Line 
              type="monotone" 
              dataKey="average" 
              stroke="#3b82f6" 
              strokeWidth={2}
              name="Average BPM"
              isAnimationActive={false}
            />
          </ComposedChart>
        ) : (
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="#e5e7eb"
              dark="#374151"
            />
            <XAxis 
              dataKey="timestamp" 
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
              label={{ value: 'BPM', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: '#1f2937',
                border: '1px solid #3b82f6',
                borderRadius: '8px',
                color: '#fff'
              }}
              formatter={(value) => [`${value} bpm`, 'Heart Rate']}
            />
            <Legend />
            <Area 
              type="monotone" 
              dataKey="average" 
              stroke="#3b82f6" 
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorValue)"
              name="Heart Rate (bpm)"
            />
          </AreaChart>
        )}
      </ResponsiveContainer>
      {chartType === 'bar' && (
        <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
          <p className="mb-2">
            <span className="inline-block w-3 h-3 bg-red-500 mr-2"></span>
            <strong>Maximum:</strong> Highest heart rate recorded in the period
          </p>
          <p className="mb-2">
            <span className="inline-block w-3 h-3 bg-lime-400 mr-2"></span>
            <strong>Minimum:</strong> Lowest heart rate recorded in the period
          </p>
          <p>
            <span className="inline-block w-3 h-3 bg-blue-500 mr-2"></span>
            <strong>Average:</strong> Average heart rate across the period
          </p>
        </div>
      )}
    </div>
  );
}
