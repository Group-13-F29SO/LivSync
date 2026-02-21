'use client';

import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';

export default function BloodGlucoseChart({ chartData, period, dataLoading, error }) {
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
        <p className="text-gray-600 dark:text-gray-400">Loading blood glucose data...</p>
      </div>
    );
  }

  if (!chartData || chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-600 dark:text-gray-400">No blood glucose data available for this period.</p>
      </div>
    );
  }

  const getChartTitle = () => {
    switch (period) {
      case 'week':
        return 'Average Blood Glucose - This Week';
      case 'month':
        return 'Average Blood Glucose - This Month';
      default:
        return 'Blood Glucose Over Time';
    }
  };

  return (
    <div>
      <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
        {getChartTitle()}
      </h2>
      <ResponsiveContainer width="100%" height={400}>
        {period === 'today' ? (
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorGlucose" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
            </defs>
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
              label={{ value: 'mg/dL', angle: -90, position: 'insideLeft' }}
              domain={[0, 200]}
            />
            {/* Reference lines for normal range */}
            <ReferenceLine 
              y={70} 
              stroke="#f59e0b" 
              strokeDasharray="3 3"
              label={{ value: 'Low (<70)', position: 'insideTopRight', fill: '#f59e0b', fontSize: 10 }}
            />
            <ReferenceLine 
              y={140} 
              stroke="#10b981" 
              strokeDasharray="3 3"
              label={{ value: 'Normal (70-140)', position: 'insideTopRight', fill: '#10b981', fontSize: 10 }}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: '#1f2937',
                border: '1px solid #6366f1',
                borderRadius: '8px',
                color: '#fff'
              }}
              formatter={(value) => {
                if (value === null) {
                  return 'No data available';
                }
                return [`${value} mg/dL`, 'Blood Glucose'];
              }}
              labelFormatter={(label) => label}
            />
            <Legend />
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke="#6366f1" 
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorGlucose)"
              name="Blood Glucose (mg/dL)"
            />
          </AreaChart>
        ) : (
          <LineChart
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
              {...(period === 'month' ? { 
                interval: 0,
                angle: -35,
                textAnchor: 'end'
              } : {})}
            />
            <YAxis 
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
              label={{ value: 'mg/dL', angle: -90, position: 'insideLeft' }}
              domain={[0, 200]}
            />
            {/* Reference lines for normal range */}
            <ReferenceLine 
              y={70} 
              stroke="#f59e0b" 
              strokeDasharray="3 3"
              label={{ value: 'Low (<70)', position: 'insideTopRight', fill: '#f59e0b', fontSize: 10 }}
            />
            <ReferenceLine 
              y={140} 
              stroke="#10b981" 
              strokeDasharray="3 3"
              label={{ value: 'Normal (70-140)', position: 'insideTopRight', fill: '#10b981', fontSize: 10 }}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: '#1f2937',
                border: '1px solid #6366f1',
                borderRadius: '8px',
                color: '#fff'
              }}
              formatter={(value) => {
                if (value === null) {
                  return 'No data available';
                }
                return [`${value} mg/dL`, 'Blood Glucose'];
              }}
              labelFormatter={(label) => label}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke="#6366f1" 
              strokeWidth={2}
              dot={{ fill: '#6366f1', r: 4 }}
              activeDot={{ r: 6 }}
              name="Blood Glucose (mg/dL)"
              isAnimationActive={true}
            />
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
