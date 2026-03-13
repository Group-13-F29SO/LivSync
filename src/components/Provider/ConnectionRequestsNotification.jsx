'use client';

import { useEffect, useState } from 'react';
import { Bell, X, Check, XCircle } from 'lucide-react';

export default function ConnectionRequestsNotification({ patientId }) {
  const [isOpen, setIsOpen] = useState(false);
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingRequestId, setLoadingRequestId] = useState(null);

  useEffect(() => {
    if (isOpen && patientId) {
      fetchRequests();
    }
  }, [isOpen, patientId]);

  const fetchRequests = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/patient/connection-requests?patientId=${patientId}`);
      const data = await response.json();
      setRequests(data.requests || []);
    } catch (error) {
      console.error('Error fetching connection requests:', error);
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

  return (
    <div className="relative">
      {/* Notification Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
        aria-label="Connection requests"
      >
        <Bell size={24} />
        {requests.length > 0 && (
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse"></span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl z-50">
          {/* Header */}
          <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-gray-50">
              Connection Requests
              {requests.length > 0 && (
                <span className="ml-2 text-sm font-normal text-gray-500">
                  ({requests.length})
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
            ) : requests.length === 0 ? (
              <div className="p-6 text-center">
                <Bell size={32} className="mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                <p className="text-gray-500 dark:text-gray-400">No connection requests</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {requests.map((request) => (
                  <div
                    key={request.id}
                    className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    {/* Provider Info */}
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

                    {/* Action Buttons */}
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
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
