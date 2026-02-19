import { useState } from 'react';

export default function CaloriesDataManagement({ selectedDate, onDataGenerated }) {
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState(null);
  const [actionError, setActionError] = useState(null);

  const handleDeleteData = async () => {
    if (!selectedDate) {
      setActionError('Please select a date');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete all calorie data for ${selectedDate}?`)) {
      return;
    }

    try {
      setActionLoading(true);
      setActionError(null);
      setActionMessage(null);

      const response = await fetch(`/api/biometrics/calories?date=${selectedDate}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete data');
      }

      const data = await response.json();
      setActionMessage(`Successfully deleted ${data.count} calorie records for ${selectedDate}`);
      
      setTimeout(() => {
        setActionMessage(null);
      }, 2000);
    } catch (err) {
      console.error('Error deleting calories data:', err);
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleGenerateData = async () => {
    if (!selectedDate) {
      setActionError('Please select a date');
      return;
    }

    try {
      setActionLoading(true);
      setActionError(null);
      setActionMessage(null);

      const response = await fetch('/api/biometrics/calories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ date: selectedDate })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to generate data');
      }

      const data = await response.json();
      setActionMessage(`Successfully generated ${data.dataPointsGenerated} calorie data points for ${selectedDate}`);
      
      setTimeout(() => {
        setActionMessage(null);
        onDataGenerated?.();
      }, 500);
    } catch (err) {
      console.error('Error generating calories data:', err);
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mb-8">
      <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
        Data Management
      </h2>
      
      <div className="flex flex-col gap-4">
        {actionMessage && (
          <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-green-800 dark:text-green-200 text-sm font-medium">{actionMessage}</p>
          </div>
        )}
        {actionError && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-800 dark:text-red-200 text-sm font-medium">Error: {actionError}</p>
          </div>
        )}
        
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleGenerateData}
            disabled={actionLoading || !selectedDate}
            className="flex-1 px-6 py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors"
          >
            {actionLoading ? 'Generating...' : 'Generate Data'}
          </button>
          
          <button
            onClick={handleDeleteData}
            disabled={actionLoading || !selectedDate}
            className="flex-1 px-6 py-3 bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors"
          >
            {actionLoading ? 'Deleting...' : 'Delete Data'}
          </button>
        </div>

        {!selectedDate && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            Select a date above to generate or delete calorie data.
          </p>
        )}
      </div>
    </div>
  );
}
