/**
 * Sync Button Component
 * Triggers biometric data generation and handles loading/success/error states
 */

'use client';

import { useState } from 'react';
import axios from 'axios';

export default function SyncButton({ onSyncComplete }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSync = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Make API request to generate biometric data
      const response = await axios.post('/api/biometrics/generate', {
        date: new Date().toISOString().split('T')[0] // Send today's date
      });

      if (response.data.success) {
        setSuccess(true);
        
        // Call callback if provided
        if (onSyncComplete) {
          onSyncComplete(response.data.data);
        }

        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccess(false);
        }, 3000);
      } else {
        setError(response.data.error || 'Sync failed');
      }
    } catch (err) {
      console.error('Sync error:', err);
      const errorMessage = 
        err.response?.data?.error ||
        err.response?.statusText ||
        err.message ||
        'Failed to sync biometric data';
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleSync}
        disabled={isLoading}
        className={`px-4 py-2 font-medium rounded-lg transition-colors ${
          isLoading
            ? 'bg-gray-400 text-white cursor-not-allowed'
            : 'bg-green-500 hover:bg-green-600 text-white'
        }`}
      >
        {isLoading ? (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            Syncing...
          </div>
        ) : (
          'Sync Now'
        )}
      </button>

      {error && (
        <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 p-2 rounded">
          ✓ Data synced successfully!
        </div>
      )}
    </div>
  );
}
