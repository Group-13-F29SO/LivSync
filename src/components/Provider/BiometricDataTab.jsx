'use client';

import { useState, useEffect } from 'react';
import { Heart, Calendar, Droplets } from 'lucide-react';
import HeartRateChart from '@/components/HeartRate/HeartRateChart';
import BloodGlucoseChart from '@/components/BloodGlucose/BloodGlucoseChart';

export default function BiometricDataTab({ patientId }) {
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [heartRateData, setHeartRateData] = useState([]);
  const [bloodGlucoseData, setBloodGlucoseData] = useState([]);
  
  const [heartRateStats, setHeartRateStats] = useState(null);
  const [bloodGlucoseStats, setBloodGlucoseStats] = useState(null);
  
  const [heartRateLoading, setHeartRateLoading] = useState(true);
  const [bloodGlucoseLoading, setBloodGlucoseLoading] = useState(true);
  
  const [heartRateError, setHeartRateError] = useState(null);
  const [bloodGlucoseError, setBloodGlucoseError] = useState(null);

  useEffect(() => {
    if (!patientId) return;
    
    const fetchHeartRateData = async () => {
      try {
        setHeartRateLoading(true);
        
        // Determine if this is a single day or multi-day range
        const isSingleDay = startDate === endDate;
        const period = isSingleDay ? 'today' : 'all';
        
        let url = `/api/provider/patient-heart-rate?patientId=${patientId}&period=${period}`;
        
        if (isSingleDay) {
          url += `&date=${startDate}`;
        } else {
          url += `&startDate=${startDate}&endDate=${endDate}`;
        }
        
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error('Failed to fetch heart rate data');
        }

        const data = await response.json();
        setHeartRateData(data.data || []);
        setHeartRateStats(data.stats);
        setHeartRateError(null);
      } catch (error) {
        console.error('Error fetching heart rate data:', error);
        setHeartRateError(error.message);
        setHeartRateData([]);
      } finally {
        setHeartRateLoading(false);
      }
    };

    fetchHeartRateData();
  }, [patientId, startDate, endDate]);

  useEffect(() => {
    if (!patientId) return;
    
    const fetchBloodGlucoseData = async () => {
      try {
        setBloodGlucoseLoading(true);
        
        // Determine if this is a single day or multi-day range
        const isSingleDay = startDate === endDate;
        const period = isSingleDay ? 'today' : 'month';
        
        let url = `/api/provider/patient-blood-glucose?patientId=${patientId}&period=${period}`;
        
        if (isSingleDay) {
          url += `&date=${startDate}`;
        } else {
          url += `&startDate=${startDate}&endDate=${endDate}`;
        }
        
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error('Failed to fetch blood glucose data');
        }

        const data = await response.json();
        setBloodGlucoseData(data.data || []);
        setBloodGlucoseStats(data.stats);
        setBloodGlucoseError(null);
      } catch (error) {
        console.error('Error fetching blood glucose data:', error);
        setBloodGlucoseError(error.message);
        setBloodGlucoseData([]);
      } finally {
        setBloodGlucoseLoading(false);
      }
    };

    fetchBloodGlucoseData();
  }, [patientId, startDate, endDate]);

  return (
    <div>
      {/* Date Range Picker */}
      <div className="flex items-center gap-4 mb-8 bg-gray-100 dark:bg-gray-800 rounded-2xl p-4">
        <div className="flex-1 relative">
          <Calendar className="absolute left-3 top-3 text-gray-400" size={18} />
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-50 focus:outline-none focus:border-blue-500"
          />
        </div>

        <span className="text-gray-400 text-2xl">→</span>

        <div className="flex-1 relative">
          <Calendar className="absolute left-3 top-3 text-gray-400" size={18} />
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-50 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Determine period for charts */}
      {(() => {
        const isSingleDay = startDate === endDate;
        const period = isSingleDay ? 'today' : 'month';

        return (
          <>
            {/* Heart Rate Chart Card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm hover:shadow-md transition-shadow mb-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center justify-center w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full">
                  <Heart size={20} className="text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
                  Heart Rate
                </h3>
                <span className="text-gray-500 dark:text-gray-400 text-sm ml-auto">
                  (bpm)
                </span>
              </div>

              {/* Stats */}
              {heartRateStats && !heartRateLoading && (
                <div className="grid grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Min</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-gray-50">
                      {Math.round(heartRateStats.min)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Max</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-gray-50">
                      {Math.round(heartRateStats.max)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Average</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-gray-50">
                      {heartRateStats.average}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Data Points</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-gray-50">
                      {heartRateStats.count}
                    </p>
                  </div>
                </div>
              )}

              {/* Chart */}
              <HeartRateChart
                chartData={heartRateData}
                period={period}
                dataLoading={heartRateLoading}
                error={heartRateError}
                chartType="area"
                useRangeBar={false}
              />
            </div>

            {/* Blood Glucose Chart Card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center justify-center w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-full">
                  <Droplets size={20} className="text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
                  Blood Glucose
                </h3>
                <span className="text-gray-500 dark:text-gray-400 text-sm ml-auto">
                  (mg/dL)
                </span>
              </div>

              {/* Stats */}
              {bloodGlucoseStats && !bloodGlucoseLoading && (
                <div className="grid grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Min</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-gray-50">
                      {Math.round(bloodGlucoseStats.min)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Max</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-gray-50">
                      {Math.round(bloodGlucoseStats.max)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Average</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-gray-50">
                      {bloodGlucoseStats.average}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Data Points</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-gray-50">
                      {bloodGlucoseStats.count}
                    </p>
                  </div>
                </div>
              )}

              {/* Chart */}
              <BloodGlucoseChart
                chartData={bloodGlucoseData}
                period={period}
                dataLoading={bloodGlucoseLoading}
                error={bloodGlucoseError}
              />
            </div>
          </>
        );
      })()}
    </div>
  );
}
