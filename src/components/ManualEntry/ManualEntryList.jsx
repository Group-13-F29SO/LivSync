'use client';

import { useState, useEffect } from 'react';
import { useManualEntry } from '@/hooks/useManualEntry';

/**
 * ManualEntryList - Display manual entries with edit/delete options
 * Props:
 * - metricType: metric type to filter
 * - date: optional date to filter (YYYY-MM-DD format)
 * - onEdit: callback when edit is clicked
 * - onDelete: callback when delete is successful
 */
export default function ManualEntryList({
  metricType,
  date = null,
  onEdit = null,
  onDelete = null,
}) {
  const [entries, setEntries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { getEntries, deleteEntry, error } = useManualEntry();
  const [deleteLoading, setDeleteLoading] = useState(null);

  useEffect(() => {
    loadEntries();
  }, [metricType, date]);

  async function loadEntries() {
    setIsLoading(true);
    try {
      const data = await getEntries(metricType, date);
      setEntries(data || []);
    } catch (err) {
      console.error('Failed to load entries:', err);
    }
    setIsLoading(false);
  }

  async function handleDelete(entryId) {
    if (!confirm('Delete this manual entry? Synced data will reappear.')) return;

    setDeleteLoading(entryId);
    try {
      await deleteEntry(entryId);
      setEntries(entries.filter(e => e.id !== entryId));
      onDelete?.(entryId);
    } catch (err) {
      console.error('Failed to delete:', err);
    }
    setDeleteLoading(null);
  }

  function formatDateTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function getUnitLabel() {
    switch (metricType) {
      case 'blood_glucose':
        return 'mg/dL';
      case 'heart_rate':
        return 'bpm';
      case 'calories':
        return 'kcal';
      case 'hydration':
        return 'ml';
      case 'steps':
        return 'steps';
      case 'sleep':
        return 'hours';
      default:
        return '';
    }
  }

  if (isLoading) {
    return <div className="text-center text-gray-500 py-4">Loading entries...</div>;
  }

  if (entries.length === 0) {
    return <div className="text-center text-gray-400 py-4">No manual entries</div>;
  }

  const unit = getUnitLabel();

  return (
    <div className="space-y-2">
      <h3 className="font-semibold text-gray-700 mb-3">Manual Entries</h3>
      {error && (
        <div className="p-3 mb-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
          {error}
        </div>
      )}
      <div className="space-y-2">
        {entries.map((entry) => (
          <div
            key={entry.id}
            className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-md"
          >
            <div className="flex-1">
              <p className="font-medium text-gray-800">
                {entry.value} {unit}
              </p>
              <p className="text-sm text-gray-600">
                {formatDateTime(entry.timestamp)}
              </p>
            </div>
            <div className="flex gap-2 ml-4">
              <button
                onClick={() => onEdit?.(entry)}
                className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(entry.id)}
                disabled={deleteLoading === entry.id}
                className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
              >
                {deleteLoading === entry.id ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
