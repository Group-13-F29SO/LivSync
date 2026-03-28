'use client';

import { useState } from 'react';
import { Calendar, Zap, Trash2 } from 'lucide-react';

export default function BiometricsTestingTool({ patientId, onActionStart, onActionEnd }) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('info'); // 'info', 'success', 'error'

  const handleGenerateBiometrics = async () => {
    try {
      setIsGenerating(true);
      onActionStart?.();
      setMessage('');

      const response = await fetch(`/api/admin/patients/${patientId}/biometrics/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ date: selectedDate }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to generate biometrics');
      }

      setMessageType('success');
      setMessage(`✓ Biometrics generated for ${selectedDate}`);
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessageType('error');
      setMessage(err.message || 'Failed to generate biometrics');
    } finally {
      setIsGenerating(false);
      onActionEnd?.();
    }
  };

  const handleDeleteBiometrics = async () => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete all biometric data for ${selectedDate}? This action cannot be undone.`
    );

    if (!confirmDelete) return;

    try {
      setIsDeleting(true);
      onActionStart?.();
      setMessage('');

      const response = await fetch(`/api/admin/patients/${patientId}/biometrics/delete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ date: selectedDate }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete biometrics');
      }

      setMessageType('success');
      setMessage(`✓ Biometrics deleted for ${selectedDate}`);
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessageType('error');
      setMessage(err.message || 'Failed to delete biometrics');
    } finally {
      setIsDeleting(false);
      onActionEnd?.();
    }
  };

  const messageStyles = {
    success: 'bg-green-500 bg-opacity-20 border-green-500',
    error: 'bg-red-500 bg-opacity-20 border-red-500',
    info: 'bg-blue-500 bg-opacity-20 border-blue-500',
  };

  const messageTextStyles = {
    success: 'text-green-600 dark:text-green-400',
    error: 'text-red-600 dark:text-red-400',
    info: 'text-blue-600 dark:text-blue-400',
  };

  return (
    <div className="bg-white dark:bg-gray-900/50 rounded-lg shadow-sm p-6 border border-amber-100 dark:border-amber-900/50">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
        <div className="p-2 bg-amber-100/70 dark:bg-amber-900/40 rounded-lg">
          <Zap className="w-5 h-5 text-amber-600 dark:text-amber-400" />
        </div>
        Testing Tools - Biometric Data
      </h2>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
        Generate or delete complete biometric data for testing purposes. Select a date and choose an action.
      </p>

      {message && (
        <div className={`mb-6 p-4 border rounded-lg ${messageStyles[messageType]}`}>
          <p className={`text-sm ${messageTextStyles[messageType]}`}>{message}</p>
        </div>
      )}

      <div className="space-y-4">
        {/* Date Selector */}
        <div className="flex items-end gap-4">
          <div className="flex-1">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Select Date
              </div>
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent font-medium"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={handleGenerateBiometrics}
            disabled={isGenerating || isDeleting}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed text-white rounded-lg transition-all duration-200 font-semibold shadow-sm hover:shadow-md"
          >
            <Zap className="w-4 h-4" />
            {isGenerating ? 'Generating...' : 'Generate Biometrics'}
          </button>
          <button
            onClick={handleDeleteBiometrics}
            disabled={isGenerating || isDeleting}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed text-white rounded-lg transition-all duration-200 font-semibold shadow-sm hover:shadow-md"
          >
            <Trash2 className="w-4 h-4" />
            {isDeleting ? 'Deleting...' : 'Delete Biometrics'}
          </button>
        </div>

        <p className="text-xs text-gray-600 dark:text-gray-400 pt-2 font-medium">
          This tool generates or deletes complete biometric data (blood glucose, heart rate, steps, sleep, hydration, calories) for the selected date.
        </p>
      </div>
    </div>
  );
}
