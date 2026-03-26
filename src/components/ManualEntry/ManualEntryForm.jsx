'use client';

import { useState } from 'react';

/**
 * ManualEntryForm - Base component for manual metric entry
 * Props:
 * - metricType: 'blood_glucose' | 'heart_rate' | 'sleep' | 'calories' | 'hydration' | 'steps'
 * - onSubmit: callback when form is submitted
 * - onCancel: callback when form is cancelled
 * - loading: whether form is in loading state
 * - error: error message to display
 */
export default function ManualEntryForm({
  metricType,
  onSubmit,
  onCancel,
  loading = false,
  error = null,
  initialData = null
}) {
  const [selectedDate, setSelectedDate] = useState(initialData?.date || today());
  const [selectedTime, setSelectedTime] = useState(initialData?.time || '12:00');
  const [value, setValue] = useState(initialData?.value || '');
  const [sleepStart, setSleepStart] = useState(initialData?.sleep_start_time || '22:00');
  const [sleepEnd, setSleepEnd] = useState(initialData?.sleep_end_time || '08:00');

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

  function formatDistanceToPast(date) {
    const now = new Date();
    const past = new Date(date);
    const diffMs = now.getTime() - past.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays} days ago`;
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (metricType === 'sleep') {
      // Sleep entry
      const startDateTime = new Date(`${selectedDate}T${sleepStart}`);
      const endDateTime = new Date(`${selectedDate}T${sleepEnd}`);

      // If end time is earlier than start time, assume it's next day
      if (endDateTime < startDateTime) {
        endDateTime.setDate(endDateTime.getDate() + 1);
      }

      onSubmit({
        metric_type: metricType,
        sleep_start_time: startDateTime.toISOString(),
        sleep_end_time: endDateTime.toISOString(),
      });
    } else {
      // Point-in-time metric entry
      if (!value) {
        alert('Please enter a value');
        return;
      }

      const entryDateTime = new Date(`${selectedDate}T${selectedTime}`);

      onSubmit({
        metric_type: metricType,
        value: parseFloat(value),
        timestamp: entryDateTime.toISOString(),
      });
    }
  }

  const timeOptions = getTimeOptions();
  const dateDistance = formatDistanceToPast(selectedDate);

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          {initialData?.id ? 'Edit' : 'Add'} {metricType.replace(/_/g, ' ')}
        </h2>
        <p className="text-sm text-gray-600 mt-1">Enter your reading manually</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Date Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date
          </label>
          <div className="flex gap-2 items-center">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              max={today()}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
            <span className="text-xs text-gray-500 whitespace-nowrap">
              ({dateDistance})
            </span>
          </div>
        </div>

        {/* Sleep-specific fields */}
        {metricType === 'sleep' ? (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sleep Start Time
              </label>
              <select
                value={sleepStart}
                onChange={(e) => setSleepStart(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sleep End Time
              </label>
              <select
                value={sleepEnd}
                onChange={(e) => setSleepEnd(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              >
                {timeOptions.map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
            </div>

            {/* Calculate and show duration */}
            {(() => {
              const start = new Date(`2000-01-01T${sleepStart}`);
              let end = new Date(`2000-01-01T${sleepEnd}`);
              if (end < start) end.setDate(end.getDate() + 1);
              const duration = (end - start) / (1000 * 60 * 60);
              return (
                <div className="p-3 bg-blue-50 rounded-md">
                  <p className="text-sm text-gray-700">
                    <strong>Duration:</strong> {duration.toFixed(1)} hours
                  </p>
                </div>
              );
            })()}
          </>
        ) : (
          <>
            {/* Time Selection for point metrics */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Time (5-minute intervals)
              </label>
              <select
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              >
                {timeOptions.map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">Times are aligned to 5-minute intervals</p>
            </div>

            {/* Value Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Value
                {metricType === 'blood_glucose' && <span className="text-gray-500"> (mg/dL)</span>}
                {metricType === 'heart_rate' && <span className="text-gray-500"> (bpm)</span>}
                {metricType === 'calories' && <span className="text-gray-500"> (kcal)</span>}
                {metricType === 'hydration' && <span className="text-gray-500"> (ml)</span>}
                {metricType === 'steps' && <span className="text-gray-500"> (steps)</span>}
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="Enter reading value"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
            </div>
          </>
        )}

        {/* Info Box */}
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-xs text-yellow-800">
            <strong>Note:</strong> Manual entries will replace synced data at the same time. You can edit or delete them later.
          </p>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {loading ? 'Saving...' : initialData?.id ? 'Update' : 'Add Reading'}
          </button>
        </div>
      </form>
    </div>
  );
}
