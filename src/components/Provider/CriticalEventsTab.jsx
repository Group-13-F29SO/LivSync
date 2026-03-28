'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

export default function CriticalEventsTab({ patientId }) {
  const [criticalEvents, setCriticalEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [historyEvents, setHistoryEvents] = useState([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState(null);
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  const fetchCriticalEvents = async () => {
    if (!patientId) return;
    
    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/provider/patient-critical-events?patientId=${patientId}&startDate=${startDate}&endDate=${endDate}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch critical events');
      }

      const data = await response.json();
      setCriticalEvents(data.events || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching critical events:', err);
      setError(err.message);
      setCriticalEvents([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchHistoryEvents = async () => {
    if (!patientId) return;
    
    try {
      setIsHistoryLoading(true);
      const response = await fetch(
        `/api/provider/patient-critical-events?patientId=${patientId}&allHistory=true`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch history');
      }

      const data = await response.json();
      setHistoryEvents(data.events || []);
      setHistoryError(null);
    } catch (err) {
      console.error('Error fetching history:', err);
      setHistoryError(err.message);
      setHistoryEvents([]);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  const handleToggleHistory = () => {
    if (!showHistory) {
      fetchHistoryEvents();
    }
    setShowHistory(!showHistory);
  };

  const handleClearAll = async () => {
    if (criticalEvents.length === 0) {
      alert('No critical events to mark as read');
      return;
    }

    const confirmed = confirm(
      `Are you sure you want to mark all ${criticalEvents.length} critical event${criticalEvents.length !== 1 ? 's' : ''} as read?`
    );

    if (!confirmed) return;

    try {
      setIsDeleting(true);
      const response = await fetch(
        `/api/provider/patient-critical-events?patientId=${patientId}`,
        {
          method: 'DELETE',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to mark critical events as read');
      }

      const data = await response.json();
      setCriticalEvents([]);
      setError(null);
    } catch (err) {
      console.error('Error marking critical events as read:', err);
      setError(err.message);
      alert('Failed to mark critical events as read. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    fetchCriticalEvents();
  }, [patientId, startDate, endDate]);

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
    <div>
      {/* Date Range Filter */}
      <div className="flex items-center gap-4 mb-6 bg-gray-100 dark:bg-gray-800 rounded-2xl p-4">
        <div className="flex-1">
          <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">
            From Date
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-50 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex-1">
          <label className="text-xs font-medium text-gray-600 dark:text-gray-400 block mb-1">
            To Date
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-50 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Events Container */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6">
        {/* Feed Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <AlertTriangle size={24} className="text-red-500" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-50">
              {showHistory ? 'Event History' : 'Critical Events'}
            </h2>
            {criticalEvents.length > 0 && (
              <span className="text-xs font-semibold px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full">
                {criticalEvents.length} event{criticalEvents.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          
          {/* Mark as Read / History Toggle Buttons */}
          <div className="flex items-center gap-2">
            {!showHistory && criticalEvents.length > 0 && (
              <button
                onClick={handleClearAll}
                disabled={isDeleting}
                className="flex items-center gap-2 px-3 py-2 bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-400 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                title="Mark all critical events as read"
              >
                <span>{isDeleting ? 'Marking as Read...' : 'Mark All as Read'}</span>
              </button>
            )}
            
            {/* History Toggle */}
            <button
              onClick={handleToggleHistory}
              disabled={isHistoryLoading}
              className="flex items-center gap-2 px-3 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              title={showHistory ? 'Hide history' : 'View event history'}
            >
              {showHistory ? (
                <>
                  <ChevronUp size={16} />
                  <span>Hide History</span>
                </>
              ) : (
                <>
                  <ChevronDown size={16} />
                  <span>View History</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400">
            <p>{error}</p>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <p className="text-gray-600 dark:text-gray-400">Loading critical events...</p>
          </div>
        )}

        {/* Event Cards */}
        {!isLoading && !error && (
          <div className="space-y-3">
            {criticalEvents.length > 0 ? (
              criticalEvents.map(event => (
                <div
                  key={event.id}
                  className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-900/20 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800/20 transition-colors"
                >
                  {/* Status Dot */}
                  <div className={`w-3 h-3 rounded-full mt-2 flex-shrink-0 ${getStatusColor(event.statusColor)}`}></div>

                  {/* Event Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
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
                    <p className="text-blue-600 dark:text-blue-400 font-bold text-sm">
                      {event.reading}
                    </p>
                  </div>

                  {/* Timestamp */}
                  <div className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap flex-shrink-0">
                    {event.timestamp}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center">
                <AlertTriangle size={32} className="mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                <p className="text-gray-500 dark:text-gray-400">
                  No critical events detected in this period. Great job!
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* History Section */}
      {showHistory && (
        <div className="mt-4 bg-white dark:bg-gray-800 rounded-2xl p-6">
          {/* History Header */}
          <div className="flex items-center gap-3 mb-6">
            <AlertTriangle size={24} className="text-blue-500" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-50">
              Event History
            </h2>
            {historyEvents.length > 0 && (
              <span className="text-xs font-semibold px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full">
                {historyEvents.length} total event{historyEvents.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {/* History Error State */}
          {historyError && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400">
              <p>{historyError}</p>
            </div>
          )}

          {/* History Loading State */}
          {isHistoryLoading && (
            <div className="flex items-center justify-center py-12">
              <p className="text-gray-600 dark:text-gray-400">Loading history...</p>
            </div>
          )}

          {/* History Event Cards */}
          {!isHistoryLoading && !historyError && (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {historyEvents.length > 0 ? (
                historyEvents.map(event => (
                  <div
                    key={event.id}
                    className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-900/20 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800/20 transition-colors"
                  >
                    {/* Status Dot */}
                    <div className={`w-3 h-3 rounded-full mt-2 flex-shrink-0 ${getStatusColor(event.statusColor)}`}></div>

                    {/* Event Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
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
                      <p className="text-blue-600 dark:text-blue-400 font-bold text-sm">
                        {event.reading}
                      </p>
                    </div>

                    {/* Timestamp */}
                    <div className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap flex-shrink-0">
                      {event.timestamp}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center">
                  <AlertTriangle size={32} className="mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                  <p className="text-gray-500 dark:text-gray-400">
                    No critical events in history.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
