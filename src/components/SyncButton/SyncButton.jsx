/**
 * Sync Button Component
 * Triggers biometric data generation and handles loading/success/error states
 * Disabled if user has no connected devices
 */

'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';

export default function SyncButton({ onSyncComplete }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [hasActiveDevices, setHasActiveDevices] = useState(true);
  const [isCheckingDevices, setIsCheckingDevices] = useState(true);

  // Check if user has active devices
  useEffect(() => {
    const checkDevices = async () => {
      try {
        setIsCheckingDevices(true);
        const response = await axios.get('/api/patient/devices');
        
        if (response.data.success) {
          const activeDevices = response.data.data.filter(device => device.is_active);
          setHasActiveDevices(activeDevices.length > 0);
        }
      } catch (err) {
        console.error('Error checking devices:', err);
        // If error, assume user can sync (don't block)
        setHasActiveDevices(true);
      } finally {
        setIsCheckingDevices(false);
      }
    };

    checkDevices();
  }, []);

  const handleSync = async () => {
    if (!hasActiveDevices) {
      setError('Please connect a device before syncing data');
      return;
    }

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
        
        // Call callback if provided with newBadges
        if (onSyncComplete) {
          onSyncComplete({
            data: response.data.data,
            newBadges: response.data.newBadges || []
          });
        }

        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccess(false);
        }, 3000);
      }
    } catch (err) {
      console.error('Sync error:', err);

      // Check if this is a "data already exists" error
      if (err.response?.status === 409 && err.response?.data?.needsConfirmation) {
        const userConfirmed = window.confirm(
          'Data already exists for today. Syncing again will replace existing data. Do you want to continue?'
        );

        if (userConfirmed) {
          // Retry with force flag
          try {
            const forceResponse = await axios.post('/api/biometrics/generate', {
              date: new Date().toISOString().split('T')[0],
              force: true
            });

            if (forceResponse.data.success) {
              setSuccess(true);

              if (onSyncComplete) {
                onSyncComplete({
                  data: forceResponse.data.data,
                  newBadges: forceResponse.data.newBadges || []
                });
              }

              setTimeout(() => {
                setSuccess(false);
              }, 3000);
            }
          } catch (forceErr) {
            console.error('Force sync error:', forceErr);
            const errorMessage = 
              forceErr.response?.data?.error ||
              forceErr.response?.statusText ||
              forceErr.message ||
              'Failed to sync biometric data';
            setError(errorMessage);
          }
        }
        // If user cancelled, don't show error
      } else {
        const errorMessage = 
          err.response?.data?.error ||
          err.response?.statusText ||
          err.message ||
          'Failed to sync biometric data';
        
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleSync}
        disabled={isLoading || !hasActiveDevices || isCheckingDevices}
        className={`px-4 py-2 font-medium rounded-lg transition-colors ${
          isLoading || isCheckingDevices
            ? 'bg-gray-400 text-white cursor-not-allowed'
            : !hasActiveDevices
            ? 'bg-gray-400 text-white cursor-not-allowed'
            : 'bg-green-500 hover:bg-green-600 text-white'
        }`}
        title={!hasActiveDevices ? 'Please connect a device to sync data' : ''}
      >
        {isLoading || isCheckingDevices ? (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            {isCheckingDevices ? 'Checking...' : 'Syncing...'}
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

      {!hasActiveDevices && !error && (
        <div className="text-sm text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
          ℹ Connect a device to sync health data
        </div>
      )}
    </div>
  );
}
