'use client';

import { useEffect, useState } from 'react';
import { Bell, X, Check, XCircle, AlertCircle } from 'lucide-react';

export default function ConnectionRequestsNotification({ patientId }) {
  const [isOpen, setIsOpen] = useState(false);
  const [requests, setRequests] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingRequestId, setLoadingRequestId] = useState(null);

  // Fetch notifications on component mount
  useEffect(() => {
    if (patientId) {
      fetchAllNotifications();
      // Poll for new recommendations every 30 seconds
      const interval = setInterval(() => fetchAllNotifications(), 30000);
      return () => clearInterval(interval);
    }
  }, [patientId]);

  // Refresh notifications when dropdown is opened
  useEffect(() => {
    if (isOpen && patientId) {
      fetchAllNotifications();
    }
  }, [isOpen, patientId]);

  const fetchAllNotifications = async () => {
    setIsLoading(true);
    try {
      // Fetch connection requests
      const connectionResponse = await fetch(`/api/patient/connection-requests?patientId=${patientId}`);
      const connectionData = await connectionResponse.json();
      setRequests(connectionData.requests || []);

      // Fetch recommendations
      const recommendationResponse = await fetch(`/api/patient/notifications?patientId=${patientId}&unreadOnly=true&limit=10`);
      const recommendationData = await recommendationResponse.json();
      setRecommendations(recommendationData.notifications || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRespond = async (requestId, action) => {
    setLoadingRequestId(requestId);
    try {
      const response = await fetch('/api/patient/respond-connection-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, action }),
      });

      if (response.ok) {
        // Remove the request from the list
        setRequests(requests.filter(r => r.id !== requestId));
      } else {
        const error = await response.json();
        alert(error.error || `Failed to ${action} request`);
      }
    } catch (error) {
      console.error('Error responding to request:', error);
      alert('An error occurred');
    } finally {
      setLoadingRequestId(null);
    }
  };

  const handleDismissRecommendation = async (notificationId) => {
    try {
      const response = await fetch('/api/patient/notifications/dismiss', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId }),
      });

      if (response.ok) {
        setRecommendations(recommendations.filter(r => r.id !== notificationId));
      }
    } catch (error) {
      console.error('Error dismissing notification:', error);
    }
  };

  const totalNotifications = requests.length + recommendations.length;
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'activity':
        return '🚶';
      case 'hydration':
        return '💧';
      case 'sleep':
        return '😴';
      case 'blood_glucose':
        return '🩺';
      case 'heart_rate':
        return '❤️';
      case 'insight':
        return '💡';
      case 'goal_progress':
        return '🎯';
      default:
        return '📌';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'border-l-4 border-red-500 bg-red-50 dark:bg-red-900/20';
      case 'medium':
        return 'border-l-4 border-orange-500 bg-orange-50 dark:bg-orange-900/20';
      case 'low':
        return 'border-l-4 border-green-500 bg-green-50 dark:bg-green-900/20';
      default:
        return 'border-l-4 border-gray-500';
    }
  };

  return (
    <div className="relative">
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
        aria-label="Notifications"
      >
        <Bell size={24} />
        {totalNotifications > 0 && (
          <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full animate-pulse flex items-center justify-center text-white text-xs font-bold">
            {totalNotifications > 9 ? '9+' : totalNotifications}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl z-50">
          {/* Header */}
          <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-gray-50">
              Notifications
              {totalNotifications > 0 && (
                <span className="ml-2 text-sm font-normal text-gray-500">
                  ({totalNotifications})
                </span>
              )}
            </h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                Loading...
              </div>
            ) : totalNotifications === 0 ? (
              <div className="p-6 text-center">
                <Bell size={32} className="mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                <p className="text-gray-500 dark:text-gray-400">No notifications</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {/* Connection Requests */}
                {requests.map((request) => (
                  <div
                    key={request.id}
                    className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <div className="mb-3">
                      <p className="font-semibold text-gray-900 dark:text-gray-50">
                        {request.providers.first_name} {request.providers.last_name}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {request.providers.specialty}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-500">
                        {request.providers.email}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        Requested{' '}
                        {new Date(request.created_at).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleRespond(request.id, 'accept')}
                        disabled={loadingRequestId === request.id}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50 font-medium rounded-lg transition-colors disabled:opacity-50"
                      >
                        <Check size={16} />
                        {loadingRequestId === request.id ? 'Processing...' : 'Accept'}
                      </button>
                      <button
                        onClick={() => handleRespond(request.id, 'reject')}
                        disabled={loadingRequestId === request.id}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 font-medium rounded-lg transition-colors disabled:opacity-50"
                      >
                        <XCircle size={16} />
                        {loadingRequestId === request.id ? 'Processing...' : 'Reject'}
                      </button>
                    </div>
                  </div>
                ))}

                {/* Recommendations */}
                {recommendations.map((rec) => (
                  <div
                    key={rec.id}
                    className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${getPriorityColor(rec.priority)}`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl flex-shrink-0">{getNotificationIcon(rec.notification_type)}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 dark:text-gray-50 truncate">
                          {rec.title}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                          {rec.message}
                        </p>
                        <div className="flex gap-2 mt-2">
                          <span className="inline-block px-2 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded capitalize">
                            {rec.notification_type.replace('_', ' ')}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-500">
                            {new Date(rec.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDismissRecommendation(rec.id)}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors flex-shrink-0"
                        title="Dismiss"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
