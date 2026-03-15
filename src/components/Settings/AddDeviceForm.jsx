'use client';

import { useState } from 'react';
import { PrimaryButton } from './Buttons';

const DEVICE_TYPES = [
  'Apple Watch',
  'Fitbit',
  'Garmin',
  'Samsung Galaxy Watch',
  'Polar',
  'Whoop',
  'Mi Band',
  'Other',
];

export default function AddDeviceForm({ onDeviceAdded, onCancel }) {
  const [formData, setFormData] = useState({
    device_name: '',
    device_type: '',
    device_model: '',
    battery_level: 100,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'battery_level' ? parseInt(value) || 100 : value
    }));
  };

  const validateForm = () => {
    if (!formData.device_name.trim()) {
      setError('Device name is required');
      return false;
    }
    if (!formData.device_type) {
      setError('Device type is required');
      return false;
    }
    if (formData.battery_level < 0 || formData.battery_level > 100) {
      setError('Battery level must be between 0 and 100');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/patient/devices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add device');
      }

      setSuccess(true);
      
      // Reset form
      setFormData({
        device_name: '',
        device_type: '',
        device_model: '',
        battery_level: 100,
      });

      // Call callback with new device
      if (onDeviceAdded) {
        onDeviceAdded(data.data);
      }

      // Clear success message after 2 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 2000);

    } catch (err) {
      console.error('Error adding device:', err);
      setError(err.message || 'Failed to add device');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Device Name */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
          Device Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="device_name"
          placeholder="e.g., My Apple Watch"
          value={formData.device_name}
          onChange={handleInputChange}
          className="w-full px-4 py-2 bg-slate-100 dark:bg-gray-800 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isLoading}
        />
      </div>

      {/* Device Type */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
          Device Type <span className="text-red-500">*</span>
        </label>
        <select
          name="device_type"
          value={formData.device_type}
          onChange={handleInputChange}
          className="w-full px-4 py-2 bg-slate-100 dark:bg-gray-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isLoading}
        >
          <option value="">Select a device type</option>
          {DEVICE_TYPES.map(type => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      {/* Device Model */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
          Device Model (Optional)
        </label>
        <input
          type="text"
          name="device_model"
          placeholder="e.g., Series 8, Gen 4"
          value={formData.device_model}
          onChange={handleInputChange}
          className="w-full px-4 py-2 bg-slate-100 dark:bg-gray-800 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isLoading}
        />
      </div>

      {/* Battery Level */}
      <div>
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
          Initial Battery Level (%)
        </label>
        <input
          type="number"
          name="battery_level"
          min="0"
          max="100"
          value={formData.battery_level}
          onChange={handleInputChange}
          className="w-full px-4 py-2 bg-slate-100 dark:bg-gray-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isLoading}
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
          ✓ Device added successfully!
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        <PrimaryButton
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? 'Adding Device...' : 'Add Device'}
        </PrimaryButton>
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="px-6 py-2 bg-slate-200 dark:bg-gray-700 hover:bg-slate-300 dark:hover:bg-gray-600 text-slate-800 dark:text-slate-100 font-medium rounded-lg transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
