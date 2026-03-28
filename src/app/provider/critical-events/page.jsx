'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { ArrowLeft, AlertTriangle, Check, Clock } from 'lucide-react';

export default function CriticalEventsPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMarkingAsRead, setIsMarkingAsRead] = useState(false);
  const [timeRange, setTimeRange] = useState(null); // null means show unread only
  const [patientsWithEvents, setPatientsWithEvents] = useState(0);
  const [totalPatients, setTotalPatients] = useState(0);
  const [isHistoryView, setIsHistoryView] = useState(false);

  // Check authorization
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
    // Only allow providers to access this page
    if (!isLoading && user && user.userType !== 'provider') {
      router.push('/dashboard');
    }
  }, [user, isLoading, router]);

  // Fetch critical events
  const fetchCriticalEvents = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      let url = `/api/provider/all-critical-events?providerId=${user.id}`;
      if (timeRange !== null) {
        url += `&hours=${timeRange}`;
      }

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Failed to fetch critical events');
      }

      const data = await response.json();
      setEvents(data.events || []);
      setTotalPatients(data.patientCount || 0);
      setPatientsWithEvents(data.patientsWithEvents || 0);
      setIsHistoryView(data.isHistoryView || false);
      setError(null);
    } catch (err) {
      console.error('Error fetching critical events:', err);
      setError(err.message);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch and when timeRange changes
  useEffect(() => {
    if (!isLoading && user?.id) {
      fetchCriticalEvents();
    }
  }, [isLoading, user?.id, timeRange]);

  // Handle mark all as read
  const handleMarkAllAsRead = async () => {
    if (events.length === 0) {
      alert('No events to mark as read');
      return;
    }

    const confirmed = confirm(
      `Are you sure you want to mark all ${events.length} event${events.length !== 1 ? 's' : ''} as read?`
    );

    if (!confirmed) return;

    try {
      setIsMarkingAsRead(true);
      const response = await fetch(
        `/api/provider/all-critical-events?providerId=${user.id}`,
        {
          method: 'PATCH',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to mark events as read');
      }

      const data = await response.json();
      
      // Refresh the events list
      await fetchCriticalEvents();
      setError(null);
    } catch (err) {
      console.error('Error marking events as read:', err);
      setError(err.message);
      alert('Failed to mark events as read. Please try again.');
    } finally {
      setIsMarkingAsRead(false);
    }
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950">
        <p className="text-gray-600 dark:text-gray-400">Loading...</p>
      </div>
    );
  }

  const getStatusColor = (color) => {
    switch (color) {
      case 'red':
        return 'bg-red-500';
      case 'orange':
        return 'bg-orange-400';
      default:
        return 'bg-gray-400';
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'critical':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400';
      case 'warning':
        return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400';
      default:
        return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-100';
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <main className="p-8 overflow-auto bg-blue-50 dark:bg-gray-950 text-gray-900 dark:text-gray-50">
        {/* Header Section */}
        <div className="flex items-start gap-4 mb-8">
          {/* Back Button */}
          <button
            onClick={() => router.back()}
            className="mt-1 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft size={24} />
          </button>

          {/* Title Section */}
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
                {isHistoryView ? 'Event History' : 'New Alerts'}
              </h1>
              {isHistoryView && (
                <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-semibold rounded-full">
                  History View
                </span>
              )}
            </div>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              {isHistoryView 
                ? 'View historical critical events across your patients'
                : 'New critical health alerts from your patients'}
            </p>
          </div>

          {/* Mark as Read Button */}
          {events.length > 0 && !isHistoryView && (
            <button
              onClick={handleMarkAllAsRead}
              disabled={isMarkingAsRead}
              className="flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-400 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Mark all as read"
            >
              <Check size={18} />
              <span>{isMarkingAsRead ? 'Marking...' : 'Mark All as Read'}</span>
            </button>
          )}
        </div>

        {/* Info Bar */}
        {!isHistoryView && (
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              💡 Use the time range selector below to view historical events. Events will be marked as read when you choose to do so.
            </p>
          </div>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* Total Events */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              {isHistoryView ? 'Total Events' : 'New Alerts'}
            </p>
            <p className="text-3xl font-bold text-red-600 dark:text-red-400">
              {events.length}
            </p>
          </div>

          {/* Patients with Events */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              Affected Patients
            </p>
            <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">
              {patientsWithEvents}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              of {totalPatients}
            </p>
          </div>

          {/* Time Range Selector */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
              Time Range
            </p>
            <select
              value={timeRange === null ? '' : timeRange}
              onChange={(e) => setTimeRange(e.target.value === '' ? null : parseInt(e.target.value))}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-50 focus:outline-none focus:border-blue-500"
            >
              <option value="">No filter (New only)</option>
              <option value={24}>Last 24 hours</option>
              <option value={72}>Last 3 days</option>
              <option value={168}>Last 7 days</option>
              <option value={720}>Last 30 days</option>
            </select>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
          {/* Error State */}
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 mb-6">
              <p>{error}</p>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <p className="text-gray-600 dark:text-gray-400">Loading events...</p>
            </div>
          )}

          {/* Events List */}
          {!loading && !error && (
            <div className="space-y-3">
              {events.length > 0 ? (
                events.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-900/20 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800/20 transition-colors cursor-pointer group"
                    onClick={() => router.push(`/provider/${event.patientId}`)}
                  >
                    {/* Status Dot */}
                    <div className={`w-3 h-3 rounded-full mt-2 flex-shrink-0 ${getStatusColor(event.statusColor)}`}></div>

                    {/* Event Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-50">
                          {event.name}
                        </h3>
                        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${getStatusBadgeColor(event.status)}`}>
                          {event.status}
                        </span>
                        {event.isAcknowledged && (
                          <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                            Read
                          </span>
                        )}
                      </div>
                      <p className="text-blue-600 dark:text-blue-400 font-bold text-sm mb-1">
                        {event.reading}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        Patient: {event.patientName}
                      </p>
                    </div>

                    {/* Timestamp */}
                    <div className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap flex-shrink-0">
                      {event.timestamp}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-12 text-center">
                  <div className="flex justify-center mb-4">
                    {isHistoryView ? (
                      <Clock size={48} className="text-gray-300 dark:text-gray-600" />
                    ) : (
                      <AlertTriangle size={48} className="text-gray-300 dark:text-gray-600" />
                    )}
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 mb-2">
                    {isHistoryView
                      ? 'No critical events in this time range'
                      : 'No new critical alerts'}
                  </p>
                  <p className="text-sm text-gray-400 dark:text-gray-500">
                    {isHistoryView
                      ? 'Try selecting a different time range to view older events'
                      : 'Great job! All your patients are in good health.'}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
