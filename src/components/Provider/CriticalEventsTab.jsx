'use client';

import { AlertTriangle } from 'lucide-react';

export default function CriticalEventsTab() {
  // Sample critical events data
  const criticalEvents = [
    {
      id: 1,
      name: 'High Heart Rate',
      status: 'critical',
      reading: '185 bpm',
      timestamp: 'Mar 02, 2026 — 2:32 PM',
      statusColor: 'red'
    },
    {
      id: 2,
      name: 'Elevated Blood Glucose',
      status: 'warning',
      reading: '280 mg/dL',
      timestamp: 'Feb 28, 2026 — 10:15 AM',
      statusColor: 'orange'
    },
    {
      id: 3,
      name: 'Low Blood Sugar',
      status: 'critical',
      reading: '62 mg/dL',
      timestamp: 'Feb 25, 2026 — 6:45 PM',
      statusColor: 'red'
    }
  ];

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
      {/* Events Container */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6">
        {/* Feed Header */}
        <div className="flex items-center gap-3 mb-6">
          <AlertTriangle size={24} className="text-red-500" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-50">
            Critical Events Feed
          </h2>
        </div>

        {/* Event Cards */}
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
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <p>No critical events recorded</p>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
