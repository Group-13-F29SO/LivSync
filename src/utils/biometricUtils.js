/**
 * Utility functions for handling manual vs synced biometric data
 */

/**
 * Deduplicates biometric data by timestamp, prioritizing manual entries
 * If multiple entries exist for the same timestamp, the manual entry (is_user_entered=true) is used
 * 
 * @param {Array} data - Array of biometric data entries from database
 * @returns {Array} Deduplicated data sorted by timestamp
 */
export function deduplicateByTimestamp(data) {
  const dataByTimestamp = new Map();
  
  data.forEach((item) => {
    const tsKey = item.timestamp.toISOString();
    const existing = dataByTimestamp.get(tsKey);
    
    // If no existing entry or current entry is manual and existing isn't, use current
    if (!existing || (item.is_user_entered && !existing.is_user_entered)) {
      dataByTimestamp.set(tsKey, item);
    }
  });

  // Convert back to array and sort
  return Array.from(dataByTimestamp.values())
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
}

/**
 * Gets the max value for a date while respecting manual entry priority
 * For sleep data which uses max value aggregation
 * 
 * @param {Array} dateEntries - All entries for a specific date
 * @returns {Object} { value: number, has_manual: boolean }
 */
export function getMaxValueWithManualPriority(dateEntries) {
  let maxValue = 0;
  let hasManual = false;
  
  for (const entry of dateEntries) {
    const value = Number(entry.value);
    if (Number.isFinite(value)) {
      // If we find a manual entry, use its value and stop looking
      if (entry.is_user_entered) {
        return { value, has_manual: true };
      }
      maxValue = Math.max(maxValue, value);
    }
  }
  
  return { value: maxValue, has_manual: hasManual };
}

/**
 * Calculates average while respecting manual entry priority
 * For metrics that use average aggregation
 * 
 * @param {Array} dateEntries - All entries for a specific date/period
 * @returns {Object} { average: number, has_manual: boolean, count: number }
 */
export function getAverageWithManualPriority(dateEntries) {
  if (dateEntries.length === 0) {
    return { average: 0, has_manual: false, count: 0 };
  }
  
  let hasManual = false;
  let sum = 0;
  let count = 0;
  
  for (const entry of dateEntries) {
    const value = Number(entry.value);
    if (Number.isFinite(value)) {
      if (entry.is_user_entered) {
        hasManual = true;
      }
      sum += value;
      count += 1;
    }
  }
  
  return { 
    average: count > 0 ? sum / count : 0, 
    has_manual: hasManual, 
    count 
  };
}

/**
 * Formats metric data with source indicator
 * 
 * @param {Object} item - Biometric data item
 * @returns {Object} Formatted item with source info
 */
export function formatWithSource(item) {
  return {
    ...item,
    is_user_entered: item.is_user_entered,
    source: item.is_user_entered ? 'manual' : item.source || 'synced'
  };
}
