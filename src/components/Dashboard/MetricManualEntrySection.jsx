'use client';

import { useState, useEffect } from 'react';
import { useManualEntry } from '@/hooks/useManualEntry';
import ManualEntryList from '@/components/ManualEntry/ManualEntryList';

/**
 * MetricManualEntrySection - Full form for manual entry on metric detail pages
 * Props:
 * - metricType: 'blood_glucose' | 'heart_rate' | 'sleep' | 'calories' | 'hydration' | 'steps'
 * - selectedDate: current selected date (YYYY-MM-DD format)
 * - onEntryAdded: callback when entry is successfully added
 */
export default function MetricManualEntrySection({
  metricType,
  selectedDate = null,
  onEntryAdded = null,
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [entryDate, setEntryDate] = useState(selectedDate || today());
  const [selectedTime, setSelectedTime] = useState('12:00');
  const [value, setValue] = useState('');
  const [sleepStart, setSleepStart] = useState('22:00');
  const [sleepEnd, setSleepEnd] = useState('08:00');
  const [successMessage, setSuccessMessage] = useState('');

  const { submitEntry, loading, error } = useManualEntry();

  function today() {
    const now = new Date();
    return now.toISOString().split('T')[0];
  }

  useEffect(() => {
    if (selectedDate) {
      setEntryDate(selectedDate);
    }
  }, [selectedDate]);

  function getTimeOptions() {
    const times = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let min = 0; min < 60; min += 5) {
        const h = String(hour).padStart(2, '0');
        const m = String(min).padStart(2, '0');
        times.push(`${h}:${m}`);
      }
    }
    return times;
  }

  function getMetricLabel(type) {
    const labels = {
      blood_glucose: 'Blood Glucose',
      heart_rate: 'Heart Rate',
      sleep: 'Sleep',
      calories: 'Calories Burned',
      hydration: 'Hydration',
      steps: 'Steps',
    };
    return labels[type] || type;
  }

  function getMetricUnit(type) {
    const units = {
      blood_glucose: 'mg/dL',
      heart_rate: 'bpm',
      sleep: 'hours',
      calories: 'kcal',
      hydration: 'ml',
      steps: 'steps',
    };
    return units[type] || '';
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSuccessMessage('');

    try {
      if (metricType === 'sleep') {
        const startDateTime = new Date(`${entryDate}T${sleepStart}`);
        const endDateTime = new Date(`${entryDate}T${sleepEnd}`);

        if (endDateTime < startDateTime) {
          endDateTime.setDate(endDateTime.getDate() + 1);
        }

        await submitEntry({
          metric_type: metricType,
          sleep_start_time: startDateTime.toISOString(),
          sleep_end_time: endDateTime.toISOString(),
        });
      } else {
        if (!value) {
          alert('Please enter a value');
          return;
        }

        const entryDateTime = new Date(`${entryDate}T${selectedTime}`);

        await submitEntry({
          metric_type: metricType,
          value: parseFloat(value),
          timestamp: entryDateTime.toISOString(),
        });
      }

      setSuccessMessage(`${getMetricLabel(metricType)} entry recorded successfully!`);
      setValue('');
      setSleepStart('22:00');
      setSleepEnd('08:00');
      setIsExpanded(false);

      onEntryAdded?.();

      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Failed to submit entry:', err);
    }
  }

  const timeOptions = getTimeOptions();
  const unit = getMetricUnit(metricType);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
      {/* Header / Collapse Button */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
          📝 Add Manual Entry
        </h3>
        <svg
          className={`w-5 h-5 text-gray-500 transition-transform ${
            isExpanded ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 14l-7 7m0 0l-7-7m7 7V3"
          />
        </svg>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4">
          {error && (
            <div className="mb-4 p-4 bg-red-100 dark:bg-red-900/20 border border-red-400 text-red-700 dark:text-red-300 rounded">
              {error}
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-4 bg-green-100 dark:bg-green-900/20 border border-green-400 text-green-700 dark:text-green-300 rounded">
              ✓ {successMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Date Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Date
              </label>
              <input
                type="date"
                value={entryDate}
                onChange={(e) => setEntryDate(e.target.value)}
                max={today()}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
            </div>

            {/* Sleep-specific fields */}
            {metricType === 'sleep' ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Sleep Start Time
                    </label>
                    <select
                      value={sleepStart}
                      onChange={(e) => setSleepStart(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={loading}
                    >
                      {timeOptions.map((time) => (
                        <option key={time} value={time}>
                          {time}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Sleep End Time
                    </label>
                    <select
                      value={sleepEnd}
                      onChange={(e) => setSleepEnd(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={loading}
                    >
                      {timeOptions.map((time) => (
                        <option key={time} value={time}>
                          {time}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Duration Display */}
                {(() => {
                  const start = new Date(`2000-01-01T${sleepStart}`);
                  let end = new Date(`2000-01-01T${sleepEnd}`);
                  if (end < start) end.setDate(end.getDate() + 1);
                  const duration = (end - start) / (1000 * 60 * 60);
                  return (
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        <strong>Sleep Duration:</strong> {duration.toFixed(1)} hours
                      </p>
                    </div>
                  );
                })()}
              </>
            ) : (
              <>
                {/* Time Selection for point metrics */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Time (5-minute intervals)
                  </label>
                  <select
                    value={selectedTime}
                    onChange={(e) => setSelectedTime(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={loading}
                  >
                    {timeOptions.map((time) => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Times must align to 5-minute intervals
                  </p>
                </div>

                {/* Value Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Reading Value ({unit})
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder={`Enter ${getMetricLabel(metricType).toLowerCase()} value`}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={loading}
                  />
                </div>
              </>
            )}

            {/* Info Box */}
            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded">
              <p className="text-xs text-yellow-700 dark:text-yellow-300">
                <strong>Note:</strong> Manual entries will replace synced data at the same time. You can edit or delete them later.
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Recording...' : 'Record Entry'}
            </button>
          </form>

          {/* Manual Entry List */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <ManualEntryList metricType={metricType} date={entryDate} />
          </div>
        </div>
      )}
    </div>
  );
}
