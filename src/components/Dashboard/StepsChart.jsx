import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';

export default function StepsChart({ chartData, dataLoading, error, period }) {
  const getBarColor = (value) => {
    if (value >= 600) return '#10b981'; // Green - very active hour
    if (value >= 300) return '#f59e0b'; // Orange - moderately active
    return '#ef4444'; // Red - low activity
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
          <p className="text-gray-600 dark:text-gray-400">Loading steps data...</p>
        </div>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
        <div className="flex items-center justify-center h-96">
          <p className="text-gray-600 dark:text-gray-400">No steps data available yet.</p>
        </div>
      </div>
    );
  }

  const getChartTitle = () => {
    switch (period) {
      case 'today':
        return 'Steps Over Time (Hourly)';
      case '7days':
        return 'Steps Over Last 7 Days';
      case '30days':
        return 'Steps Over Last 30 Days';
      default:
        return 'Steps Over All Time';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
      <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
        {getChartTitle()}
      </h2>
      
      {period === 'today' ? (
        // Bar chart for single day
        <ResponsiveContainer width="100%" height={400}>
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 30, left: 0, bottom: 40 }}
          >
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="#e5e7eb"
              verticalPoints={[0, 6, 12, 18]}
            />
            <XAxis 
              dataKey="timestamp" 
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
              interval={5}
              tick={(props) => {
                const { x, y, payload } = props;
                const startTime = payload.value.split('-')[0].trim();
                
                return (
                  <g transform={`translate(${x},${y})`}>
                    <text x={0} y={0} dy={4} textAnchor="middle" fill="#6b7280" fontSize={12}>
                      {startTime}
                    </text>
                  </g>
                );
              }}
            />
            <YAxis 
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
              label={{ value: 'Steps', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: '#ffffff',
                border: '1px solid #3b82f6',
                borderRadius: '8px',
                color: '#000000'
              }}
              labelStyle={{ color: '#000000' }}
              formatter={(value) => [value.toLocaleString() + ' steps', 'Hourly Steps']}
            />
            <Legend />
            <Bar 
              dataKey="value" 
              name="Steps"
              radius={[8, 8, 0, 0]}
              minPointSize={2}
              background={{ fill: '#e5e7eb', fillOpacity: 0.25 }}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getBarColor(entry.value)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      ) : (
        // Bar chart for multi-day periods
        <ResponsiveContainer width="100%" height={400}>
          <BarChart
            data={chartData}
            margin={{ top: 10, right: 30, left: 0, bottom: 60 }}
          >
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="#e5e7eb"
            />
            <XAxis 
              dataKey="timestamp" 
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis 
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
              label={{ value: 'Steps', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: '#ffffff',
                border: '1px solid #3b82f6',
                borderRadius: '8px',
                color: '#000000'
              }}
              labelStyle={{ color: '#000000' }}
              formatter={(value) => {
                if (value === 0) return ['No data', 'Steps'];
                return [value.toLocaleString() + ' steps', 'Daily Steps'];
              }}
            />
            <Legend />
            <Bar 
              dataKey="value" 
              name="Daily Steps"
              radius={[8, 8, 0, 0]}
              fill="#3b82f6"
              minPointSize={2}
              background={{ fill: '#e5e7eb', fillOpacity: 0.25 }}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
      
      {period === 'today' && (
        // Legend for colors (only for today view showing hourly data)
        <div className="mt-4 flex items-center justify-center gap-6 text-sm flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span className="text-gray-600 dark:text-gray-400">Very Active (≥600 steps/hr)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-orange-500 rounded"></div>
            <span className="text-gray-600 dark:text-gray-400">Moderate (300-599 steps/hr)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span className="text-gray-600 dark:text-gray-400">Low Activity (&lt;300 steps/hr)</span>
          </div>
        </div>
      )}
    </div>
  );
}
