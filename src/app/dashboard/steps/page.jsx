'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar/Navbar';
import { useAuth } from '@/hooks/useAuth';
import PeriodSelector from '@/components/HeartRate/PeriodSelector';
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

export default function StepsChartPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [chartData, setChartData] = useState([]);
  const [stats, setStats] = useState(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState('today');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [startDateRange, setStartDateRange] = useState('');
  const [endDateRange, setEndDateRange] = useState(new Date().toISOString().split('T')[0]);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState(null);
  const [actionError, setActionError] = useState(null);

  const GOAL = 10000; // Daily step goal

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  const fetchStepsData = async () => {
    try {
      setDataLoading(true);
      let url = `/api/biometrics/steps?period=${period}`;
      
      // If period is "today", include the selected date
      if (period === 'today') {
        url += `&date=${selectedDate}`;
      }
      
      // If period is "all", include the date range
      if (period === 'all' && startDateRange) {
        url += `&startDate=${startDateRange}&endDate=${endDateRange}`;
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch steps data');
      }

      const result = await response.json();
      setChartData(result.data);
      setStats(result.stats);
      setError(null);
    } catch (err) {
      console.error('Error fetching steps data:', err);
      setError(err.message);
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchStepsData();
    }
  }, [user, period, selectedDate, startDateRange, endDateRange]);

  // Get bar color based on hourly activity level
  const getBarColor = (value) => {
    if (value >= 600) return '#10b981'; // Green - very active hour
    if (value >= 300) return '#f59e0b'; // Orange - moderately active
    return '#ef4444'; // Red - low activity
  };

  const handleDeleteData = async () => {
    if (!selectedDate) {
      setActionError('Please select a date');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete all step data for ${selectedDate}?`)) {
      return;
    }

    try {
      setActionLoading(true);
      setActionError(null);
      setActionMessage(null);

      const response = await fetch(`/api/biometrics/steps?date=${selectedDate}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete data');
      }

      const data = await response.json();
      setActionMessage(`Successfully deleted ${data.count} step records for ${selectedDate}`);
      
      // Refresh the data
      setTimeout(() => {
        setChartData([]);
        setStats(null);
        setActionMessage(null);
      }, 2000);
    } catch (err) {
      console.error('Error deleting steps data:', err);
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleGenerateData = async () => {
    if (!selectedDate) {
      setActionError('Please select a date');
      return;
    }

    try {
      setActionLoading(true);
      setActionError(null);
      setActionMessage(null);

      const response = await fetch('/api/biometrics/steps', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ date: selectedDate })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to generate data');
      }

      const data = await response.json();
      setActionMessage(`Successfully generated ${data.dataPointsGenerated} step data points for ${selectedDate}`);
      
      // Refresh the chart data
      setTimeout(() => {
        fetchStepsData();
      }, 500);
    } catch (err) {
      console.error('Error generating steps data:', err);
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950">
        <p className="text-gray-600 dark:text-gray-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-white dark:bg-gray-950">
      <Navbar />

      {/* Main Content Area */}
      <main className="flex-1 p-8 ml-20 overflow-auto bg-blue-50 dark:bg-gray-950 text-gray-900 dark:text-gray-50">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="inline-block text-3xl font-bold bg-gradient-to-br from-blue-600 via-purple-500 to-pink-400 bg-clip-text text-transparent">
              Steps Tracker
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Monitor your daily step count and activity level
            </p>
          </div>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-gray-300 hover:bg-gray-400 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium rounded-lg transition-colors"
          >
            Back
          </button>
        </div>

        {/* Period Selector */}
        <PeriodSelector period={period} onPeriodChange={setPeriod} />

        {/* Date Picker - only show for "today" period */}
        {period === 'today' && (
          <div className="mb-6 flex items-center gap-4">
            <label htmlFor="date-picker" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Select Date:
            </label>
            <input
              id="date-picker"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        {/* Date Range Picker - only show for "all" period */}
        {period === 'all' && (
          <div className="mb-6 flex items-center gap-4">
            <label htmlFor="start-date-picker" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Start Date:
            </label>
            <input
              id="start-date-picker"
              type="date"
              value={startDateRange}
              onChange={(e) => setStartDateRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <label htmlFor="end-date-picker" className="text-sm font-medium text-gray-700 dark:text-gray-300">
              End Date:
            </label>
            <input
              id="end-date-picker"
              type="date"
              value={endDateRange}
              onChange={(e) => setEndDateRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        )}

        {/* Data Management Section */}
        {period === 'today' && (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mb-8">
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
              Data Management
            </h2>
            
            <div className="flex flex-col gap-4">
              {/* Action Messages */}
              {actionMessage && (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <p className="text-green-800 dark:text-green-200 text-sm font-medium">{actionMessage}</p>
                </div>
              )}
              {actionError && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-red-800 dark:text-red-200 text-sm font-medium">Error: {actionError}</p>
                </div>
              )}

              {/* Date Selection and Controls */}
              <div className="flex flex-col md:flex-row gap-4 items-end">
                <button
                  onClick={handleGenerateData}
                  disabled={actionLoading}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
                >
                  {actionLoading ? (
                    <>
                      <span className="animate-spin">⋯</span>
                      Generating...
                    </>
                  ) : (
                    <>
                      ✓ Generate Data
                    </>
                  )}
                </button>

                <button
                  onClick={handleDeleteData}
                  disabled={actionLoading}
                  className="px-6 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
                >
                  {actionLoading ? (
                    <>
                      <span className="animate-spin">⋯</span>
                      Deleting...
                    </>
                  ) : (
                    <>
                      ✕ Delete Data
                    </>
                  )}
                </button>
              </div>

              <p className="text-xs text-gray-500 dark:text-gray-400">
                💡 Tip: Use this to delete old cumulative data and generate fresh per-interval data for testing.
              </p>
            </div>
          </div>
        )}

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Total Steps</p>
              <p className="text-3xl font-bold text-blue-600 mt-2">
                {stats.total.toLocaleString()}
              </p>
              <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">
                {period === 'today' ? 'steps' : 'total steps'}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
                {period === 'today' ? 'Daily Average' : 'Average Daily Steps'}
              </p>
              <p className="text-3xl font-bold text-purple-600 mt-2">
                {stats.average.toLocaleString()}
              </p>
              <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">
                {period === 'today' ? 'steps/hour' : 'steps/day'}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Peak</p>
              <p className="text-3xl font-bold text-green-600 mt-2">
                {stats.max.toLocaleString()}
              </p>
              <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">
                {period === 'today' ? 'steps/hour' : 'steps'}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
                {period === 'today' ? 'Goal Achievement' : 'Days with Data'}
              </p>
              <p className="text-3xl font-bold text-orange-600 mt-2">
                {period === 'today' ? (stats.goalAchieved ? 'Achieved' : 'Not Met') : stats.daysWithData}
              </p>
              <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">
                {period === 'today' ? `${stats.goal} steps/day goal` : `of ${stats.totalDays} days`}
              </p>
            </div>
          </div>
        )}

        {/* Chart Section */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
          {error ? (
            <div className="text-red-600 dark:text-red-400 p-4 bg-red-50 dark:bg-red-900/20 rounded">
              Error: {error}
            </div>
          ) : dataLoading ? (
            <div className="flex items-center justify-center h-96">
              <p className="text-gray-600 dark:text-gray-400">Loading steps data...</p>
            </div>
          ) : chartData.length === 0 ? (
            <div className="flex items-center justify-center h-96">
              <p className="text-gray-600 dark:text-gray-400">No steps data available yet.</p>
            </div>
          ) : (
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
                {period === 'today' 
                  ? 'Steps Over Time (Hourly)' 
                  : period === '7days' 
                  ? 'Steps Over Last 7 Days' 
                  : period === '30days'
                  ? 'Steps Over Last 30 Days'
                  : 'Steps Over All Time'}
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
                        // payload.value is like "12am-1am", "1am-2am", "12pm-1pm", etc.
                        // Extract the start time part before the dash
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
                <div className="mt-4 flex items-center justify-center gap-6 text-sm">
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
          )}
        </div>

        {/* Additional Info */}
        {period === 'today' && (
          <>
            <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-900 dark:text-blue-200">Hourly Steps & Activity Information</h3>
              <ul className="mt-2 text-sm text-blue-800 dark:text-blue-300 space-y-1">
                <li>• <strong>Chart Breakdown:</strong> Each bar represents steps taken during that hour (12am-1am, 1am-2am, etc.)</li>
                <li>• <strong>6-Hour Intervals:</strong> The x-axis is labeled at 12am, 6am, 12pm, and 6pm for easy reference</li>
                <li>• <strong>Daily Goal:</strong> 10,000 steps per day for general health (~417 steps/hour average)</li>
                <li>• <strong>Activity Patterns:</strong> Step counts naturally vary by hour based on your daily schedule and routines</li>
                <li>• <strong>Peak Hours:</strong> Most people are more active during morning, afternoon, and early evening hours</li>
              </ul>
            </div>

            {/* Activity Levels */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-lg">
                <h4 className="font-semibold text-red-900 dark:text-red-200">Low Activity</h4>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-2">&lt; 300</p>
                <p className="text-sm text-red-600 dark:text-red-400 mt-1">steps/hour</p>
              </div>
              <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 p-4 rounded-lg">
                <h4 className="font-semibold text-orange-900 dark:text-orange-200">Moderate Activity</h4>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-2">300-599</p>
                <p className="text-sm text-orange-600 dark:text-orange-400 mt-1">steps/hour</p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4 rounded-lg">
                <h4 className="font-semibold text-green-900 dark:text-green-200">Very Active</h4>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-2">≥ 600</p>
                <p className="text-sm text-green-600 dark:text-green-400 mt-1">steps/hour</p>
              </div>
            </div>
          </>
        )}

        {period !== 'today' && (
          <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-900 dark:text-blue-200">Daily Steps Summary</h3>
            <ul className="mt-2 text-sm text-blue-800 dark:text-blue-300 space-y-1">
              <li>• <strong>Chart Shows:</strong> Total steps per day for the selected time period</li>
              <li>• <strong>Daily Goal:</strong> 10,000 steps per day is the recommended daily target</li>
              <li>• <strong>Trend Analysis:</strong> Monitor your activity trends over time to improve fitness</li>
              <li>• <strong>Missing Days:</strong> Days without data are displayed as gaps in the chart</li>
              <li>• <strong>Average Calculation:</strong> Daily average is calculated from all days in the period</li>
            </ul>
          </div>
        )}
      </main>
    </div>
  );
}
