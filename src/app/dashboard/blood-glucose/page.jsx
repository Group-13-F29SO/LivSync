'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar/Navbar';
import { useAuth } from '@/hooks/useAuth';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
  ReferenceLine
} from 'recharts';

export default function BloodGlucoseChartPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [chartData, setChartData] = useState([]);
  const [stats, setStats] = useState(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    const fetchBloodGlucoseData = async () => {
      try {
        setDataLoading(true);
        const response = await fetch('/api/biometrics/blood-glucose');
        
        if (!response.ok) {
          throw new Error('Failed to fetch blood glucose data');
        }

        const result = await response.json();
        setChartData(result.data);
        setStats(result.stats);
      } catch (err) {
        console.error('Error fetching blood glucose data:', err);
        setError(err.message);
      } finally {
        setDataLoading(false);
      }
    };

    if (user) {
      fetchBloodGlucoseData();
    }
  }, [user]);

  // Determine status based on average
  const getGlucoseStatus = (value) => {
    if (value < 70) return { status: 'Low', color: 'text-yellow-600' };
    if (value >= 70 && value <= 140) return { status: 'Normal', color: 'text-green-600' };
    if (value > 140 && value <= 180) return { status: 'Elevated', color: 'text-orange-600' };
    return { status: 'High', color: 'text-red-600' };
  };

  const statusInfo = stats ? getGlucoseStatus(stats.average) : null;

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
            <h1 className="inline-block text-3xl font-bold bg-gradient-to-br from-indigo-600 via-purple-500 to-pink-400 bg-clip-text text-transparent">
              Blood Glucose Monitor
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Track your blood glucose levels over time
            </p>
          </div>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-gray-300 hover:bg-gray-400 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium rounded-lg transition-colors"
          >
            Back
          </button>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Average Level</p>
              <p className={`text-3xl font-bold ${statusInfo?.color || 'text-indigo-600'} mt-2`}>
                {stats.average}
              </p>
              <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">mg/dL</p>
              {statusInfo && (
                <p className={`text-sm font-medium ${statusInfo.color} mt-2`}>
                  {statusInfo.status}
                </p>
              )}
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Maximum</p>
              <p className="text-3xl font-bold text-red-600 mt-2">{stats.max}</p>
              <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">mg/dL</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Minimum</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{stats.min}</p>
              <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">mg/dL</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">Data Points</p>
              <p className="text-3xl font-bold text-purple-600 mt-2">{stats.count}</p>
              <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">readings</p>
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
              <p className="text-gray-600 dark:text-gray-400">Loading blood glucose data...</p>
            </div>
          ) : chartData.length === 0 ? (
            <div className="flex items-center justify-center h-96">
              <p className="text-gray-600 dark:text-gray-400">No blood glucose data available yet.</p>
            </div>
          ) : (
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
                Blood Glucose Over Time
              </h2>
              <ResponsiveContainer width="100%" height={400}>
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
                    label={{ value: 'Low (<70)', position: 'right', fill: '#f59e0b', fontSize: 10 }}
                  />
                  <ReferenceLine 
                    y={140} 
                    stroke="#10b981" 
                    strokeDasharray="3 3"
                    label={{ value: 'Normal (70-140)', position: 'right', fill: '#10b981', fontSize: 10 }}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: '1px solid #6366f1',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                    formatter={(value) => [`${value} mg/dL`, 'Blood Glucose']}
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
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Additional Info */}
        <div className="mt-8 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 p-4 rounded-lg">
          <h3 className="font-semibold text-indigo-900 dark:text-indigo-200">Blood Glucose Information</h3>
          <ul className="mt-2 text-sm text-indigo-800 dark:text-indigo-300 space-y-1">
            <li>• <strong>Normal Fasting:</strong> 70-100 mg/dL (before meals)</li>
            <li>• <strong>Normal Post-Meal:</strong> Less than 140 mg/dL (2 hours after eating)</li>
            <li>• <strong>Prediabetes:</strong> 100-125 mg/dL (fasting)</li>
            <li>• <strong>Diabetes:</strong> 126 mg/dL or higher (fasting) on two separate tests</li>
            <li>• <strong>Hypoglycemia:</strong> Below 70 mg/dL - seek immediate attention if symptoms occur</li>
          </ul>
        </div>

        {/* Health Ranges */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4 rounded-lg">
            <h4 className="font-semibold text-green-900 dark:text-green-200">Normal Range</h4>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-2">70-140</p>
            <p className="text-sm text-green-700 dark:text-green-300 mt-1">mg/dL</p>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-4 rounded-lg">
            <h4 className="font-semibold text-yellow-900 dark:text-yellow-200">Low (Hypoglycemia)</h4>
            <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-2">&lt; 70</p>
            <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">mg/dL</p>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-lg">
            <h4 className="font-semibold text-red-900 dark:text-red-200">High (Hyperglycemia)</h4>
            <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-2">&gt; 140</p>
            <p className="text-sm text-red-700 dark:text-red-300 mt-1">mg/dL (post-meal)</p>
          </div>
        </div>
      </main>
    </div>
  );
}
