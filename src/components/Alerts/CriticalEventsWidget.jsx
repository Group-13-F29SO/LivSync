'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CriticalEventsWidget() {
  const router = useRouter();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchRecentEvents();
    // Refresh every 30 seconds
    const interval = setInterval(fetchRecentEvents, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchRecentEvents = async () => {
    try {
      const res = await fetch('/api/patient/critical-events?limit=5&acknowledged=false');
      const json = await res.json();

      if (json.success) {
        setEvents(json.data);
        setUnreadCount(json.data.length);
      }
    } catch (err) {
      console.error('Failed to fetch critical events:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewAll = () => {
    router.push('/critical-events');
  };

  const handleClearAll = async () => {
    if (events.length === 0) {
      return;
    }

    const confirmed = confirm(
      `Are you sure you want to clear all ${events.length} critical event${events.length !== 1 ? 's' : ''}? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      const res = await fetch('/api/patient/critical-events', {
        method: 'DELETE',
      });

      if (res.ok) {
        setEvents([]);
        setUnreadCount(0);
      } else {
        console.error('Failed to clear events:', res.statusText);
        alert('Failed to clear events. Please try again.');
      }
    } catch (err) {
      console.error('Failed to clear events:', err);
      alert('Failed to clear events. Please try again.');
    }
  };

  const getMetricLabel = (metric) => {
    const labels = {
      steps: 'Steps',
      heart_rate: 'Heart Rate',
      calories: 'Calories',
      hydration: 'Hydration',
      sleep: 'Sleep',
      blood_glucose: 'Blood Glucose',
    };
    return labels[metric] || metric;
  };

  const getMetricUnit = (metric) => {
    const units = {
      steps: '',
      heart_rate: 'bpm',
      calories: 'kcal',
      hydration: 'glasses',
      sleep: 'hrs',
      blood_glucose: 'mg/dL',
    };
    return units[metric] || '';
  };

  const formatDate = (date) => {
    const d = new Date(date);
    const now = new Date();
    const diffMinutes = Math.floor((now - d) / 60000);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return d.toLocaleDateString();
  };

  return (
    <div 
      onClick={handleViewAll}
      className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 cursor-pointer hover:shadow-lg dark:hover:shadow-lg transition-shadow"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
          Critical Events
        </h3>
        {unreadCount > 0 && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
            {unreadCount} unread
          </span>
        )}
      </div>

      {loading ? (
        <div className="py-8 text-center text-gray-500 dark:text-gray-400">
          <p>Loading events...</p>
        </div>
      ) : events.length === 0 ? (
        <div className="py-8 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-gray-600 dark:text-gray-400 text-sm">No critical events detected</p>
          <p className="text-gray-500 dark:text-gray-500 text-xs mt-1">Your biomarkers are within normal ranges</p>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((event) => (
            <div
              key={event.id}
              className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
            >
              <div className="flex-shrink-0 mt-0.5">
                <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-red-900 dark:text-red-200">
                  {getMetricLabel(event.metricType)} - {event.thresholdType === 'max' ? 'Too High' : 'Too Low'}
                </p>
                <p className="text-xs text-red-700 dark:text-red-300 mt-1">
                  Reading: <span className="font-bold">{event.value} {getMetricUnit(event.metricType)}</span>
                  {' '}
                  ({event.thresholdType === 'max' ? 'above' : 'below'} {event.thresholdValue})
                </p>
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                  {formatDate(event.createdAt)}
                </p>
              </div>
            </div>
          ))}

          <div className="flex gap-2 mt-4">
            <button
              onClick={handleViewAll}
              className="flex-1 px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
            >
              View All
            </button>
            <button
              onClick={handleClearAll}
              className="flex-1 px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            >
              Clear All
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
