/**
 * Alert Service
 * Utility functions for managing alert thresholds and critical events
 */

/**
 * Check if a value breaches alert thresholds
 */
export async function checkValueAgainstThresholds(patientId, metricType, value) {
  try {
    const response = await fetch('/api/patient/alert-thresholds/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patientId,
        metricType,
        value,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to check thresholds');
    }

    return await response.json();
  } catch (error) {
    console.error('Error checking thresholds:', error);
    return { success: false, breached: false, events: [] };
  }
}

/**
 * Fetch all alert thresholds for a patient
 */
export async function fetchAlertThresholds() {
  try {
    const response = await fetch('/api/patient/alert-thresholds');
    if (!response.ok) {
      throw new Error('Failed to fetch thresholds');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching thresholds:', error);
    return { success: false, data: [] };
  }
}

/**
 * Save or update alert threshold for a metric
 */
export async function saveAlertThreshold(metricType, minValue, maxValue) {
  try {
    const response = await fetch('/api/patient/alert-thresholds', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        metricType,
        minValue,
        maxValue,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to save threshold');
    }

    return await response.json();
  } catch (error) {
    console.error('Error saving threshold:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Fetch critical events for a patient
 */
export async function fetchCriticalEvents(limit = 50, offset = 0, acknowledged = null) {
  try {
    let url = `/api/patient/critical-events?limit=${limit}&offset=${offset}`;
    if (acknowledged !== null) {
      url += `&acknowledged=${acknowledged}`;
    }

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch critical events');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching critical events:', error);
    return { success: false, data: [], pagination: {} };
  }
}

/**
 * Acknowledge a critical event
 */
export async function acknowledgeCriticalEvent(eventId) {
  try {
    const response = await fetch(`/api/patient/critical-events/${eventId}`, {
      method: 'PATCH',
    });

    if (!response.ok) {
      throw new Error('Failed to acknowledge event');
    }

    return await response.json();
  } catch (error) {
    console.error('Error acknowledging event:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get metric-specific information
 */
export const metricConfig = {
  steps: { label: 'Steps', unit: '', category: 'activity' },
  heart_rate: { label: 'Heart Rate', unit: 'bpm', category: 'cardiovascular' },
  blood_glucose: { label: 'Blood Glucose', unit: 'mg/dL', category: 'metabolic' },
  calories: { label: 'Calories Burned', unit: 'kcal', category: 'energy' },
  hydration: { label: 'Hydration', unit: 'glasses', category: 'hydration' },
  sleep: { label: 'Sleep', unit: 'hours', category: 'recovery' },
};

/**
 * Get label for a metric type
 */
export function getMetricLabel(metricType) {
  return metricConfig[metricType]?.label || metricType;
}

/**
 * Get unit for a metric type
 */
export function getMetricUnit(metricType) {
  return metricConfig[metricType]?.unit || '';
}

/**
 * Format alert threshold message
 */
export function getThresholdMessage(thresholdType, thresholdValue) {
  if (thresholdType === 'min') {
    return `Below minimum threshold of ${thresholdValue}`;
  } else if (thresholdType === 'max') {
    return `Above maximum threshold of ${thresholdValue}`;
  }
  return 'Threshold exceeded';
}

/**
 * Get alert severity (used for styling)
 */
export function getAlertSeverity(thresholdType) {
  if (thresholdType === 'max') {
    return 'critical'; // High alert - critical
  } else if (thresholdType === 'min') {
    return 'warning'; // Low alert - warning
  }
  return 'info';
}

/**
 * Format time difference for display
 */
export function formatTimeSince(date) {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now - d;
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return d.toLocaleDateString();
}
