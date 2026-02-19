import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';

export default function CaloriesChart({ chartData, dataLoading, error, period }) {
  const getBarColor = (value) => {
    if (value >= 250) return '#f97316'; // Orange - high activity
    if (value >= 150) return '#fbbf24'; // Amber - moderate activity
    return '#fca5a5'; // Light red - low activity
  };

  const getChartTitle = () => {
    switch (period) {
      case 'today':
        return 'Calories Burned Over Time (Hourly)';
      case 'week':
        return 'Calories Burned This Week (Daily)';
      case 'month':
        return 'Calories Burned This Month (Daily Trend)';
      default:
        return 'Calories Burned Over Time';
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
          <p className="text-gray-600 dark:text-gray-400">Loading calories data...</p>
        </div>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
        <div className="flex items-center justify-center h-96">
          <p className="text-gray-600 dark:text-gray-400">No calories data available yet.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
      <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
        {getChartTitle()}
      </h2>
      <ResponsiveContainer width="100%" height={400}>
        {period === 'today' ? (
          // Area chart for today
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorCalories" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f97316" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#f97316" stopOpacity={0.1} />
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
              label={{ value: 'Calories (kcal)', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: '#1f2937',
                border: '1px solid #f97316',
                borderRadius: '8px',
                color: '#fff'
              }}
              formatter={(value) => [value.toLocaleString() + ' kcal', 'Calories Burned']}
            />
            <Legend />
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke="#f97316" 
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorCalories)"
              name="Calories Burned (kcal)"
            />
          </AreaChart>
        ) : period === 'week' ? (
          // Bar chart for week
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 30, left: 0, bottom: 40 }}
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
              label={{ value: 'Calories (kcal)', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: '#1f2937',
                border: '1px solid #f97316',
                borderRadius: '8px',
                color: '#fff'
              }}
              formatter={(value) => [value.toLocaleString() + ' kcal', 'Total Calories']}
            />
            <Legend />
            <Bar 
              dataKey="value" 
              fill="#f97316"
              radius={[8, 8, 0, 0]}
              name="Calories Burned (kcal)"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry.value)} />
              ))}
            </Bar>
          </BarChart>
        ) : (
          // Line chart for month (trend)
          <LineChart
            data={chartData}
            margin={{ top: 10, right: 30, left: 0, bottom: 40 }}
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
              label={{ value: 'Calories (kcal)', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: '#1f2937',
                border: '1px solid #f97316',
                borderRadius: '8px',
                color: '#fff'
              }}
              formatter={(value) => [value.toLocaleString() + ' kcal', 'Daily Calories']}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke="#f97316"
              strokeWidth={3}
              dot={{ fill: '#f97316', r: 4 }}
              activeDot={{ r: 6 }}
              name="Calories Burned (kcal)"
            />
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
