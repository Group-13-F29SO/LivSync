'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, CheckCircle2, Info, AlertTriangle, Calendar, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import DetailPageHeader from '@/components/Admin/DetailPageHeader';

export default function SecurityLogsPage() {
  const router = useRouter();
  const [activeLogs, setActiveLogs] = useState([]);
  const [dismissedLogs, setDismissedLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [activeFilterSeverity, setActiveFilterSeverity] = useState('');
  const [activeFilterEventType, setActiveFilterEventType] = useState('');
  const [activePage, setActivePage] = useState(1);
  const [activeTotalPages, setActiveTotalPages] = useState(1);
  
  const [dismissedFilterSeverity, setDismissedFilterSeverity] = useState('');
  const [dismissedFilterEventType, setDismissedFilterEventType] = useState('');
  const [dismissedFilterStartDate, setDismissedFilterStartDate] = useState('');
  const [dismissedFilterEndDate, setDismissedFilterEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [dismissedPage, setDismissedPage] = useState(1);
  const [dismissedTotalPages, setDismissedTotalPages] = useState(1);

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
    fetchActiveLogs();
  }, [activePage, activeFilterSeverity, activeFilterEventType]);

  useEffect(() => {
    fetchDismissedLogs();
  }, [dismissedPage, dismissedFilterSeverity, dismissedFilterEventType, dismissedFilterStartDate, dismissedFilterEndDate]);

  const fetchActiveLogs = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: activePage.toString(),
        limit: '10',
        isRead: 'false',
      });

      if (activeFilterSeverity) {
        params.append('severity', activeFilterSeverity);
      }

      if (activeFilterEventType) {
        params.append('eventType', activeFilterEventType);
      }

      const response = await fetch(`/api/admin/logs?${params}`);

      if (!response.ok) {
        throw new Error('Failed to fetch active logs');
      }

      const data = await response.json();
      setActiveLogs(data.logs);
      setActiveTotalPages(data.pagination.totalPages);
    } catch (err) {
      setError(err.message || 'Failed to load active security logs');
      console.error('Error fetching active logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDismissedLogs = async () => {
    try {
      const params = new URLSearchParams({
        page: dismissedPage.toString(),
        limit: '10',
        isRead: 'true',
      });

      if (dismissedFilterSeverity) {
        params.append('severity', dismissedFilterSeverity);
      }

      if (dismissedFilterEventType) {
        params.append('eventType', dismissedFilterEventType);
      }

      if (dismissedFilterStartDate) {
        params.append('startDate', dismissedFilterStartDate);
      }

      if (dismissedFilterEndDate) {
        params.append('endDate', dismissedFilterEndDate);
      }

      const response = await fetch(`/api/admin/logs?${params}`);

      if (!response.ok) {
        throw new Error('Failed to fetch dismissed logs');
      }

      const data = await response.json();
      setDismissedLogs(data.logs);
      setDismissedTotalPages(data.pagination.totalPages);
    } catch (err) {
      setError(err.message || 'Failed to load dismissed logs');
      console.error('Error fetching dismissed logs:', err);
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

      setActiveLogs((prevLogs) =>
        prevLogs.filter((log) => log.id !== logId)
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

  const LogItem = ({ log, showDismissButton = false }) => {
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
            <div className="flex items-center gap-2 flex-wrap">
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
            <div className="flex items-center gap-4 mt-2 text-xs text-gray-600 dark:text-gray-400 flex-wrap">
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
        {showDismissButton && (
          <button
            onClick={() => handleMarkAsRead(log.id)}
            className="ml-4 p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors flex-shrink-0"
            aria-label="Dismiss log"
            title="Mark as read and dismiss"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400" />
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <DetailPageHeader
        title="Security Logs"
        subtitle="View and manage all system security events"
        icon={AlertCircle}
        gradient={false}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-28">
        {error && (
          <div className="mb-6 p-4 bg-red-500 bg-opacity-20 border border-red-500 rounded-lg">
            <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Active Logs Section */}
        <div className="mb-12">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Active Logs
              <span className="ml-2 text-sm font-normal text-gray-600 dark:text-gray-400">
                ({activeLogs.length} unreviewed)
              </span>
            </h2>

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
              <select
                value={activeFilterSeverity}
                onChange={(e) => {
                  setActiveFilterSeverity(e.target.value);
                  setActivePage(1);
                }}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
              >
                <option value="">All Severities</option>
                <option value="critical">Critical</option>
                <option value="warning">Warning</option>
                <option value="info">Info</option>
              </select>

              <select
                value={activeFilterEventType}
                onChange={(e) => {
                  setActiveFilterEventType(e.target.value);
                  setActivePage(1);
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

          {isLoading && activeLogs.length === 0 ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mb-2"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading active logs...</p>
            </div>
          ) : activeLogs.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-8 text-center border border-gray-200 dark:border-gray-800">
              <CheckCircle2 className="w-12 h-12 mx-auto text-green-400 dark:text-green-500 mb-3" />
              <p className="text-gray-600 dark:text-gray-400">All logs reviewed! No active security events.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeLogs.map((log) => (
                <LogItem key={log.id} log={log} showDismissButton={true} />
              ))}

              {/* Pagination */}
              {activeTotalPages > 1 && (
                <div className="flex justify-center gap-2 mt-6">
                  <button
                    onClick={() => setActivePage(Math.max(1, activePage - 1))}
                    disabled={activePage === 1}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    Previous
                  </button>
                  <span className="px-4 py-2 text-gray-600 dark:text-gray-400">
                    Page {activePage} of {activeTotalPages}
                  </span>
                  <button
                    onClick={() => setActivePage(Math.min(activeTotalPages, activePage + 1))}
                    disabled={activePage === activeTotalPages}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Dismissed Logs Section */}
        <div>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Dismissed Logs
            </h2>

            {/* Filters */}
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                <input
                  type="date"
                  value={dismissedFilterStartDate}
                  onChange={(e) => {
                    setDismissedFilterStartDate(e.target.value);
                    setDismissedPage(1);
                  }}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
                />
                <span className="text-gray-600 dark:text-gray-400">to</span>
                <input
                  type="date"
                  value={dismissedFilterEndDate}
                  onChange={(e) => {
                    setDismissedFilterEndDate(e.target.value);
                    setDismissedPage(1);
                  }}
                  max={new Date().toISOString().split('T')[0]}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
                />
              </div>

              <select
                value={dismissedFilterSeverity}
                onChange={(e) => {
                  setDismissedFilterSeverity(e.target.value);
                  setDismissedPage(1);
                }}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm"
              >
                <option value="">All Severities</option>
                <option value="critical">Critical</option>
                <option value="warning">Warning</option>
                <option value="info">Info</option>
              </select>

              <select
                value={dismissedFilterEventType}
                onChange={(e) => {
                  setDismissedFilterEventType(e.target.value);
                  setDismissedPage(1);
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

          {dismissedLogs.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-8 text-center border border-gray-200 dark:border-gray-800">
              <Info className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-600 mb-3" />
              <p className="text-gray-600 dark:text-gray-400">No dismissed logs found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {dismissedLogs.map((log) => (
                <LogItem key={log.id} log={log} showDismissButton={false} />
              ))}

              {/* Pagination */}
              {dismissedTotalPages > 1 && (
                <div className="flex justify-center gap-2 mt-6">
                  <button
                    onClick={() => setDismissedPage(Math.max(1, dismissedPage - 1))}
                    disabled={dismissedPage === 1}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    Previous
                  </button>
                  <span className="px-4 py-2 text-gray-600 dark:text-gray-400">
                    Page {dismissedPage} of {dismissedTotalPages}
                  </span>
                  <button
                    onClick={() => setDismissedPage(Math.min(dismissedTotalPages, dismissedPage + 1))}
                    disabled={dismissedPage === dismissedTotalPages}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
