'use client';

import { useState } from 'react';
import { SecondaryButton, DangerButton, PrimaryButton } from './Buttons';
import axios from 'axios';

export default function DeviceCard({ device, onUpdate, onRemove }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const WatchIcon = () => (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );

  const BatteryIcon = ({ percentage }) => {
    let fillColor = 'text-green-500';
    if (percentage < 20) fillColor = 'text-red-500';
    else if (percentage < 50) fillColor = 'text-yellow-500';

    return (
      <div className="flex items-center gap-2">
        <svg className={`w-6 h-6 ${fillColor}`} fill="currentColor" viewBox="0 0 24 24">
          <path d="M15.67 4H14V2h-4v2H8.33C7.6 4 7 4.6 7 5.33v15.33C7 21.4 7.6 22 8.33 22h7.33c.74 0 1.34-.6 1.34-1.33V5.33C17 4.6 16.4 4 15.67 4z" />
        </svg>
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{percentage}%</span>
      </div>
    );
  };

  const getLastSyncedText = () => {
    if (!device.last_sync) {
      return 'Never synced';
    }
    const date = new Date(device.last_sync);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours === 0) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    }
  };

  const handleSync = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await axios.post('/api/biometrics/generate', {
        date: new Date().toISOString().split('T')[0]
      });

      if (response.data.success) {
        setSuccess('Data synced successfully!');

        // Update device with new last_sync time
        const updateResponse = await fetch(`/api/patient/devices/${device.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ last_sync: new Date().toISOString() })
        });

        if (updateResponse.ok) {
          const updatedDevice = await updateResponse.json();
          if (onUpdate) {
            onUpdate(updatedDevice.data);
          }
        }

        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      console.error('Sync error:', err);
      setError(err.message || 'Failed to sync data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleConnection = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/patient/devices/${device.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !device.is_active })
      });

      if (!response.ok) {
        throw new Error('Failed to update device connection');
      }

      const data = await response.json();
      setSuccess(device.is_active ? 'Device disconnected' : 'Device reconnected');
      
      if (onUpdate) {
        onUpdate(data.data);
      }

      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Connection toggle error:', err);
      setError(err.message || 'Failed to update device');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = async () => {
    if (!window.confirm('Are you sure you want to remove this device? Your health data will be preserved.')) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/patient/devices/${device.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to remove device');
      }

      if (onRemove) {
        onRemove(device.id);
      }
    } catch (err) {
      console.error('Remove error:', err);
      setError(err.message || 'Failed to remove device');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-slate-50 dark:bg-gray-800 rounded-xl p-4 border border-slate-200 dark:border-gray-700">
      <div className="flex items-start justify-between gap-4">
        {/* Device Info */}
        <div className="flex items-start gap-4 flex-1">
          <div className="text-blue-600 dark:text-blue-400 mt-1">
            <WatchIcon />
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-1">
              {device.device_name}
            </h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  device.is_active
                    ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}>
                  <span className={`w-2 h-2 rounded-full mr-1.5 ${device.is_active ? 'bg-green-500' : 'bg-gray-500'}`}></span>
                  {device.is_active ? 'Connected' : 'Disconnected'}
                </span>
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  {device.device_type}
                </span>
                {device.device_model && (
                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    ({device.device_model})
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4">
                <BatteryIcon percentage={device.battery_level || 0} />
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  Last synced: {getLastSyncedText()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 min-w-max">
          {device.is_active ? (
            <>
              <PrimaryButton onClick={handleSync} disabled={isLoading}>
                Sync Now
              </PrimaryButton>
              <SecondaryButton onClick={handleToggleConnection} disabled={isLoading}>
                Disconnect
              </SecondaryButton>
            </>
          ) : (
            <SecondaryButton onClick={handleToggleConnection} disabled={isLoading}>
              Reconnect
            </SecondaryButton>
          )}
          <DangerButton onClick={handleRemove} disabled={isLoading}>
            Remove
          </DangerButton>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="mt-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded">
          {error}
        </div>
      )}
      {success && (
        <div className="mt-3 text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 p-2 rounded">
          ✓ {success}
        </div>
      )}
    </div>
  );
}
