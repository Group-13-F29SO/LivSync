'use client';

import { useState } from 'react';

export default function DownloadDataButton({ patientId, username }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleDownloadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);

      // Make request to export data
      const response = await fetch(`/api/patient/export-data?patientId=${patientId}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to export data');
      }

      // Create blob from response and trigger download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `livsync-data-${username}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setSuccess('Your data has been downloaded successfully!');
    } catch (err) {
      console.error('Error downloading data:', err);
      setError(err.message || 'Failed to download data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-6 p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 rounded-lg border border-blue-200 dark:border-gray-700">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Download Your Data
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
            Export all your personal data in JSON format, including profile information, health metrics, goals, devices, and more. You have full control of your data.
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Your data will be compiled securely and downloaded to your device.
          </p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-red-700 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded text-green-700 dark:text-green-400 text-sm">
          {success}
        </div>
      )}

      {/* Action Button */}
      <div className="mt-4">
        <button
          onClick={handleDownloadData}
          disabled={isLoading}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
            isLoading
              ? 'bg-gray-400 dark:bg-gray-600 text-white cursor-not-allowed'
              : 'bg-blue-600 dark:bg-blue-700 text-white hover:bg-blue-700 dark:hover:bg-blue-600 active:scale-95'
          }`}
        >
          {isLoading ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Compiling Data...</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>Download My Data</span>
            </>
          )}
        </button>
      </div>

      {/* Information Box */}
      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded text-xs text-blue-700 dark:text-blue-400">
        <strong>What's included:</strong> Profile info, health metrics, goals, devices, achievements, notifications, alert thresholds, and connection data.
      </div>
    </div>
  );
}
