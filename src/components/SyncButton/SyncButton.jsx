/**
 * Sync Icon Component
 * Triggers biometric data generation and handles loading/success/error states
 * Rendered as an icon button next to the Last Synced label
 */

'use client';

import { useState, useEffect } from 'react';
import { RotateCcw } from 'lucide-react';
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
        
        // Call callback if provided with newBadges and alerts
        if (onSyncComplete) {
          onSyncComplete({
            data: response.data.data,
            newBadges: response.data.newBadges || [],
            alerts: response.data.alerts || []
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
                  newBadges: forceResponse.data.newBadges || [],
                  alerts: forceResponse.data.alerts || []
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
    <button
      onClick={handleSync}
      disabled={isLoading || !hasActiveDevices || isCheckingDevices}
      className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50"
      title={!hasActiveDevices ? 'Please connect a device to sync data' : 'Sync now'}
    >
      <RotateCcw className={`w-5 h-5 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 ${isLoading || isCheckingDevices ? 'animate-spin' : ''}`} />
    </button>
  );
}
