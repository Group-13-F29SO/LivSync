'use client';

import { useState } from 'react';
import { useManualEntry } from '@/hooks/useManualEntry';

/**
 * QuickManualEntryCard - Dashboard card for quick manual metric entry
 * Allows users to select metric type and enter reading
 */
export default function QuickManualEntryCard() {
  const [selectedMetric, setSelectedMetric] = useState('blood_glucose');
  const [selectedDate, setSelectedDate] = useState(today());
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
      if (selectedMetric === 'sleep') {
        const startDateTime = new Date(`${selectedDate}T${sleepStart}`);
        const endDateTime = new Date(`${selectedDate}T${sleepEnd}`);

        if (endDateTime < startDateTime) {
          endDateTime.setDate(endDateTime.getDate() + 1);
        }

        await submitEntry({
          metric_type: selectedMetric,
          sleep_start_time: startDateTime.toISOString(),
          sleep_end_time: endDateTime.toISOString(),
        });
      } else {
        if (!value) {
          alert('Please enter a value');
          return;
        }

        const entryDateTime = new Date(`${selectedDate}T${selectedTime}`);

        await submitEntry({
          metric_type: selectedMetric,
          value: parseFloat(value),
          timestamp: entryDateTime.toISOString(),
        });
      }

      setSuccessMessage(`${getMetricLabel(selectedMetric)} entry recorded successfully!`);
      setValue('');
      setSleepStart('22:00');
      setSleepEnd('08:00');
      setSelectedDate(today());
      setSelectedTime('12:00');

      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Failed to submit entry:', err);
    }
  }

  const timeOptions = getTimeOptions();
  const unit = getMetricUnit(selectedMetric);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
      <h2 className="text-xl font-bold text-gray-900 dark:text-gray-50 mb-1">
        📝 Quick Entry
      </h2>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Manually log a reading
      </p>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded text-sm">
          ✓ {successMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Metric Type Selection */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
            Metric Type
          </label>
          <select
            value={selectedMetric}
            onChange={(e) => setSelectedMetric(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          >
            <option value="blood_glucose">Blood Glucose</option>
            <option value="heart_rate">Heart Rate</option>
            <option value="sleep">Sleep</option>
            <option value="calories">Calories Burned</option>
            <option value="hydration">Hydration</option>
            <option value="steps">Steps</option>
          </select>
        </div>

        {/* Date Selection */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
            Date
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            max={today()}
            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
        </div>

        {/* Sleep-specific fields */}
        {selectedMetric === 'sleep' ? (
          <>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Start Time
                </label>
                <select
                  value={sleepStart}
                  onChange={(e) => setSleepStart(e.target.value)}
                  className="w-full px-2 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  End Time
                </label>
                <select
                  value={sleepEnd}
                  onChange={(e) => setSleepEnd(e.target.value)}
                  className="w-full px-2 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            {(() => {
              const start = new Date(`2000-01-01T${sleepStart}`);
              let end = new Date(`2000-01-01T${sleepEnd}`);
              if (end < start) end.setDate(end.getDate() + 1);
              const duration = (end - start) / (1000 * 60 * 60);
              return (
                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-xs text-blue-700 dark:text-blue-300">
                  Duration: {duration.toFixed(1)} hours
                </div>
              );
            })()}
          </>
        ) : (
          <>
            {/* Time Selection for point metrics */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Time
              </label>
              <select
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              >
                {timeOptions.map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
            </div>

            {/* Value Input */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Value ({unit})
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="Enter reading"
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
            </div>
          </>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Recording...' : 'Record Entry'}
        </button>
      </form>
    </div>
  );
}
