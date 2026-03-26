import { useState, useCallback } from 'react';

/**
 * useManualEntry - Hook for managing manual metric entries
 * 
 * Usage:
 * const { submitEntry, deleteEntry, updateEntry, getEntries, loading, error } = useManualEntry();
 */
export function useManualEntry() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const submitEntry = useCallback(async (entryData) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/biometrics/manual-entry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(entryData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit entry');
      }

      const result = await response.json();
      setLoading(false);
      return result.data;
    } catch (err) {
      setError(err.message);
      setLoading(false);
      throw err;
    }
  }, []);

  const updateEntry = useCallback(async (entryId, entryData) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/biometrics/manual-entry/${entryId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(entryData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update entry');
      }

      const result = await response.json();
      setLoading(false);
      return result.data;
    } catch (err) {
      setError(err.message);
      setLoading(false);
      throw err;
    }
  }, []);

  const deleteEntry = useCallback(async (entryId) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/biometrics/manual-entry/${entryId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete entry');
      }

      const result = await response.json();
      setLoading(false);
      return result;
    } catch (err) {
      setError(err.message);
      setLoading(false);
      throw err;
    }
  }, []);

  const getEntries = useCallback(async (metricType, date = null) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (metricType) params.append('metric_type', metricType);
      if (date) params.append('date', date);

      const response = await fetch(`/api/biometrics/manual-entry?${params}`, {
        method: 'GET',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to fetch entries');
      }

      const result = await response.json();
      setLoading(false);
      return result.data || [];
    } catch (err) {
      setError(err.message);
      setLoading(false);
      return [];
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    submitEntry,
    updateEntry,
    deleteEntry,
    getEntries,
    loading,
    error,
    clearError,
  };
}
