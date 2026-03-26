'use client';

import { useState } from 'react';
import ManualEntryForm from './ManualEntryForm';
import { useManualEntry } from '@/hooks/useManualEntry';

/**
 * ManualEntryModal - Modal wrapper for manual metric entry
 * Props:
 * - isOpen: whether modal is open
 * - metricType: metric type to add
 * - onClose: callback when modal is closed
 * - onSuccess: callback when entry is successfully submitted
 * - initialData: existing entry data for edit mode
 */
export default function ManualEntryModal({
  isOpen,
  metricType,
  onClose,
  onSuccess,
  initialData = null,
}) {
  const [submitError, setSubmitError] = useState(null);
  const { submitEntry, updateEntry, loading, error } = useManualEntry();

  async function handleSubmit(entryData) {
    try {
      setSubmitError(null);
      let result;

      if (initialData?.id) {
        // Update mode
        result = await updateEntry(initialData.id, entryData);
      } else {
        // Create mode
        result = await submitEntry(entryData);
      }

      onSuccess?.(result);
      onClose();
    } catch (err) {
      setSubmitError(err.message);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-h-[90vh] overflow-y-auto">
        <ManualEntryForm
          metricType={metricType}
          onSubmit={handleSubmit}
          onCancel={onClose}
          loading={loading}
          error={submitError || error}
          initialData={initialData}
        />
      </div>
    </div>
  );
}
