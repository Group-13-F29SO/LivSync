'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function CriticalEventsPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, unacknowledged, acknowledged
  const [page, setPage] = useState(0);
  const [totalEvents, setTotalEvents] = useState(0);
  const pageSize = 20;

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user) {
      fetchEvents();
    }
  }, [user, filter, page]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const acknowledged = filter === 'all' ? null : filter === 'acknowledged' ? 'true' : 'false';
      let url = `/api/patient/critical-events?limit=${pageSize}&offset=${page * pageSize}`;
      if (acknowledged !== null) {
        url += `&acknowledged=${acknowledged}`;
      }

      const res = await fetch(url);
      const json = await res.json();

      if (json.success) {
        setEvents(json.data);
        setTotalEvents(json.pagination.total);
      }
    } catch (err) {
      console.error('Failed to fetch critical events:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = async (eventId) => {
    try {
      const res = await fetch(`/api/patient/critical-events/${eventId}`, {
        method: 'PATCH',
      });

      if (res.ok) {
        setEvents((prev) =>
          prev.map((e) =>
            e.id === eventId
              ? { ...e, isAcknowledged: true, acknowledgedAt: new Date() }
              : e
          )
        );
      }
    } catch (err) {
      console.error('Failed to acknowledge event:', err);
    }
  };

  const handleClearAll = async () => {
    if (events.length === 0) {
      alert('No events to clear');
      return;
    }

    const confirmed = confirm(
      `Are you sure you want to clear all ${events.length} critical event${events.length !== 1 ? 's' : ''}? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      setLoading(true);
      const res = await fetch('/api/patient/critical-events', {
        method: 'DELETE',
      });

      if (res.ok) {
        const data = await res.json();
        setEvents([]);
        setTotalEvents(0);
        setPage(0);
      } else {
        console.error('Failed to clear events:', res.statusText);
        alert('Failed to clear events. Please try again.');
      }
    } catch (err) {
      console.error('Failed to clear events:', err);
      alert('Failed to clear events. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    const unreadCount = events.filter(e => !e.isAcknowledged).length;
    
    if (unreadCount === 0) {
      alert('No unread events to mark');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/patient/critical-events', {
        method: 'PATCH',
      });

      if (res.ok) {
        const data = await res.json();
        // Update all events to be marked as read
        setEvents((prev) =>
          prev.map((e) => ({
            ...e,
            isAcknowledged: true,
            acknowledgedAt: new Date(),
          }))
        );
        // Refresh to get updated data
        await fetchEvents();
      } else {
        console.error('Failed to mark events as read:', res.statusText);
        alert('Failed to mark events as read. Please try again.');
      }
    } catch (err) {
      console.error('Failed to mark events as read:', err);
      alert('Failed to mark events as read. Please try again.');
    } finally {
      setLoading(false);
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
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950">
        <p className="text-gray-600 dark:text-gray-400">Loading...</p>
      </div>
    );
  }

  const totalPages = Math.ceil(totalEvents / pageSize);

  return (
    <div className="min-h-screen flex bg-white dark:bg-gray-950">
      <main className="flex-1 overflow-auto bg-blue-50 dark:bg-gray-950 text-gray-900 dark:text-gray-50">
        <div className="p-8 max-w-6xl pb-32">
          <div className="mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              Critical Events Log
            </h1>
            <p className="text-slate-500 dark:text-slate-400">
              View and manage your health alert history
            </p>
          </div>

          {/* Filter Tabs and Clear All Button */}
          <div className="flex items-center justify-between mb-6 border-b border-slate-200 dark:border-gray-700">
            <div className="flex gap-2">
              {['all', 'unread', 'read'].map((filterOption) => {
                const filterValue = filterOption === 'unread' ? 'unacknowledged' : filterOption === 'read' ? 'acknowledged' : 'all';
                return (
                  <button
                    key={filterOption}
                    onClick={() => {
                      setFilter(filterValue);
                      setPage(0);
                    }}
                    className={`px-4 py-2 font-medium text-sm transition-colors capitalize ${
                      filter === filterValue
                        ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    {filterOption === 'all'
                      ? `All (${totalEvents})`
                      : filterOption === 'unread'
                      ? 'Unread'
                      : 'Read'}
                  </button>
                );
              })}
            </div>
            {totalEvents > 0 && (
              <div className="flex gap-2">
                <button
                  onClick={handleMarkAllAsRead}
                  disabled={loading || events.filter(e => !e.isAcknowledged).length === 0}
                  className="px-3 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Mark All as Read
                </button>
                <button
                  onClick={handleClearAll}
                  disabled={loading}
                  className="px-3 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Clear All
                </button>
              </div>
            )}
          </div>

          {/* Events Table */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-slate-200 dark:border-gray-700 overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                <p>Loading events...</p>
              </div>
            ) : events.length === 0 ? (
              <div className="p-8 text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  {filter === 'all'
                    ? 'No critical events found'
                    : filter === 'unacknowledged'
                    ? 'All events have been read'
                    : 'No read events yet'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 dark:bg-gray-700 border-b border-slate-200 dark:border-gray-600">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                        Metric
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                        Reading
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                        Alert Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                        Triggered
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-gray-700">
                    {events.map((event) => (
                      <tr key={event.id} className="hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                              {getMetricLabel(event.metricType)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-slot-900 dark:text-slate-100 font-semibold">
                            {event.value} {getMetricUnit(event.metricType)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              event.thresholdType === 'max'
                                ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                            }`}
                          >
                            {event.thresholdType === 'max' ? 'Too High' : 'Too Low'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                          {formatDate(event.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {event.isAcknowledged ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                              Read
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                              Unread
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {!event.isAcknowledged && (
                            <button
                              onClick={() => handleAcknowledge(event.id)}
                              className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
                            >
                              Mark as Read
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-slate-600 dark:text-slate-400">
                Showing {page * pageSize + 1} to {Math.min((page + 1) * pageSize, totalEvents)} of{' '}
                {totalEvents} events
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                  className="px-4 py-2 bg-slate-100 dark:bg-gray-700 text-slate-700 dark:text-slate-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Previous
                </button>
                <div className="flex items-center gap-2">
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setPage(i)}
                      className={`px-3 py-2 rounded-lg font-medium transition-colors ${
                        page === i
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 dark:bg-gray-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                  disabled={page >= totalPages - 1}
                  className="px-4 py-2 bg-slate-100 dark:bg-gray-700 text-slate-700 dark:text-slate-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
