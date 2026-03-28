'use client';

import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function SecurityLogsWidget() {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterSeverity, setFilterSeverity] = useState('');
  const [filterEventType, setFilterEventType] = useState('');
  const [lastRefreshTime, setLastRefreshTime] = useState(new Date());
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(true);

  const SEVERITY_COLORS = {
    critical: {
      bg: 'bg-red-50 dark:bg-red-900/20',
      text: 'text-red-700 dark:text-red-400',
      icon: 'text-red-600 dark:text-red-400',
      badge: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200',
    },
    warning: {
      bg: 'bg-amber-50 dark:bg-amber-900/20',
      text: 'text-amber-700 dark:text-amber-400',
      icon: 'text-amber-600 dark:text-amber-400',
      badge: 'bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200',
    },
    info: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      text: 'text-blue-700 dark:text-blue-400',
      icon: 'text-blue-600 dark:text-blue-400',
      badge: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200',
    },
  };

  const EVENT_TYPES = {
    login_success: 'Successful Login',
    login_failed: 'Failed Login',
    incorrect_password: 'Incorrect Password',
    account_locked: 'Account Locked',
    logout: 'Logout',
    admin_action: 'Admin Action',
    permission_denied: 'Permission Denied',
  };

  useEffect(() => {
    fetchLogs();
  }, [page, filterSeverity, filterEventType]);

  // Auto-refresh logs every 5 seconds
  useEffect(() => {
    if (!isAutoRefreshing) return;

    const interval = setInterval(() => {
      fetchLogs();
      setLastRefreshTime(new Date());
    }, 15000);

    return () => clearInterval(interval);
  }, [isAutoRefreshing, page, filterSeverity, filterEventType]);

  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        isRead: 'false',
      });

      if (filterSeverity) {
        params.append('severity', filterSeverity);
      }

      if (filterEventType) {
        params.append('eventType', filterEventType);
      }

      const response = await fetch(`/api/admin/logs?${params}`);

      if (!response.ok) {
        throw new Error('Failed to fetch logs');
      }

      const data = await response.json();
      setLogs(data.logs);
      setTotalPages(data.pagination.totalPages);
    } catch (err) {
      setError(err.message || 'Failed to load security logs');
      console.error('Error fetching logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsRead = async (logId) => {
    try {
      const response = await fetch(`/api/admin/logs/${logId}`, {
        method: 'PATCH',
      });

      if (!response.ok) {
        throw new Error('Failed to mark log as read');
      }

      setLogs((prevLogs) =>
        prevLogs.map((log) =>
          log.id === logId ? { ...log, is_read: true, read_at: new Date() } : log
        )
      );
    } catch (err) {
      console.error('Error marking log as read:', err);
    }
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle className="w-5 h-5" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5" />;
      default:
        return <Info className="w-5 h-5" />;
    }
  };

  return (
    <div className="mb-12">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Security Logs
          </h2>
          <div className="flex items-center gap-3">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Last updated: {lastRefreshTime.toLocaleTimeString()}
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isAutoRefreshing}
                onChange={(e) => setIsAutoRefreshing(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 dark:border-gray-600"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Auto-refresh (15s)</span>
            </label>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-4">
          <select
            value={filterSeverity}
            onChange={(e) => {
              setFilterSeverity(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
          >
            <option value="">All Severities</option>
            <option value="critical">Critical</option>
            <option value="warning">Warning</option>
            <option value="info">Info</option>
          </select>

          <select
            value={filterEventType}
            onChange={(e) => {
              setFilterEventType(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
          >
            <option value="">All Event Types</option>
            {Object.entries(EVENT_TYPES).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mb-2"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading security logs...</p>
        </div>
      ) : logs.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-8 text-center border border-gray-200 dark:border-gray-800">
          <Info className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-600 mb-3" />
          <p className="text-gray-600 dark:text-gray-400">No security logs found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => {
            const colors = SEVERITY_COLORS[log.severity] || SEVERITY_COLORS.info;
            return (
              <div
                key={log.id}
                className={`${colors.bg} border-l-4 ${
                  log.severity === 'critical'
                    ? 'border-red-500'
                    : log.severity === 'warning'
                    ? 'border-amber-500'
                    : 'border-blue-500'
                } rounded-lg p-4 flex items-start justify-between`}
              >
                <div className="flex items-start gap-3 flex-1">
                  <div className={`mt-0.5 ${colors.icon}`}>
                    {getSeverityIcon(log.severity)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className={`font-semibold ${colors.text}`}>
                        {EVENT_TYPES[log.event_type] || log.event_type}
                      </h3>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${colors.badge}`}>
                        {log.severity}
                      </span>
                      {!log.is_read && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200">
                          New
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                      {log.message}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-600 dark:text-gray-400">
                      {log.user_email && (
                        <span>Email: <strong>{log.user_email}</strong></span>
                      )}
                      {log.user_type && (
                        <span>Type: <strong>{log.user_type}</strong></span>
                      )}
                      <span>
                        {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleMarkAsRead(log.id)}
                  className="ml-2 flex-shrink-0 p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-400"
                  title="Dismiss log"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          <span className="text-sm text-gray-600 dark:text-gray-400">
            Page {page} of {totalPages}
          </span>

          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
