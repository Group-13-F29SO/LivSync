'use client';

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend
} from 'recharts';

export default function HeartRateChart({ period, chartData, dataLoading, error }) {
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

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
      <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
        Heart Rate Over Time
        {getPeriodLabel()}
      </h2>
      <ResponsiveContainer width="100%" height={400}>
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
            dataKey="value" 
            stroke="#3b82f6" 
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorValue)"
            name="Heart Rate (bpm)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
