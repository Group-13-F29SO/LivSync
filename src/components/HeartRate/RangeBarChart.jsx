'use client';

import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend
} from 'recharts';

export default function RangeBarChart({ chartData, period }) {
  const getPeriodLabel = () => {
    switch (period) {
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

  return (
    <div className="w-full">
      <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
        Heart Rate Over Time
        {getPeriodLabel()}
      </h2>
      
      <ResponsiveContainer width="100%" height={400}>
        <LineChart
          data={chartData}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#e5e7eb"
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
            cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
            content={(props) => {
              const { active, payload } = props;
              if (!active || !payload || !payload[0]) return null;
              const data = payload[0].payload;
              if (!data.hasData) {
                return (
                  <div className="bg-gray-900 text-white p-2 rounded text-sm">
                    <p className="font-semibold">{data.timestamp}</p>
                    <p className="text-gray-400">No data recorded</p>
                  </div>
                );
              }
              return (
                <div className="bg-gray-900 text-white p-2 rounded text-sm">
                  <p className="font-semibold">{data.timestamp}</p>
                  <p className="text-red-400">Max: {data.max} bpm</p>
                  <p className="text-blue-400">Avg: {data.average} bpm</p>
                  <p className="text-cyan-400">Min: {data.min} bpm</p>
                </div>
              );
            }}
          />
          <Legend />
          
          {/* Max BPM line */}
          <Line
            type="monotone"
            dataKey="max"
            stroke="#ef4444"
            strokeWidth={2}
            name="Max BPM"
            connectNulls={true}
            isAnimationActive={false}
            dot={(props) => {
              const { cx, cy, payload } = props;
              if (!payload || !payload.hasData) return null;
              return (
                <circle
                  cx={cx}
                  cy={cy}
                  r={3}
                  fill="#ef4444"
                  stroke="#fff"
                  strokeWidth={1}
                />
              );
            }}
            activeDot={{ r: 5 }}
          />

          {/* Average BPM line */}
          <Line
            type="monotone"
            dataKey="average"
            stroke="#3b82f6"
            strokeWidth={2.5}
            name="Average BPM"
            connectNulls={true}
            isAnimationActive={false}
            dot={(props) => {
              const { cx, cy, payload } = props;
              if (!payload || !payload.hasData) return null;
              return (
                <circle
                  cx={cx}
                  cy={cy}
                  r={4}
                  fill="#fff"
                  stroke="#3b82f6"
                  strokeWidth={2}
                />
              );
            }}
            activeDot={{ r: 6 }}
          />

          {/* Min BPM line */}
          <Line
            type="monotone"
            dataKey="min"
            stroke="#06b6d4"
            strokeWidth={2}
            name="Min BPM"
            connectNulls={true}
            isAnimationActive={false}
            dot={(props) => {
              const { cx, cy, payload } = props;
              if (!payload || !payload.hasData) return null;
              return (
                <circle
                  cx={cx}
                  cy={cy}
                  r={3}
                  fill="#06b6d4"
                  stroke="#fff"
                  strokeWidth={1}
                />
              );
            }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>

      <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
        <p className="mb-2">
          <span className="inline-block w-6 h-0.5 bg-red-500 mr-2"></span>
          <strong>Red line:</strong> Maximum heart rate for each day
        </p>
        <p className="mb-2">
          <span className="inline-block w-6 h-0.5 bg-blue-500 mr-2"></span>
          <strong>Blue line:</strong> Average heart rate for each day
        </p>
        <p>
          <span className="inline-block w-6 h-0.5 bg-cyan-500 mr-2"></span>
          <strong>Cyan line:</strong> Minimum heart rate for each day
        </p>
      </div>
    </div>
  );
}
