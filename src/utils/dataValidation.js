/**
 * Data Validation Utilities for Biometric Data
 * Validates generated data against specifications
 */

const VALID_RANGES = {
  steps: { min: 0, max: 20000 },
  heart_rate: { min: 40, max: 200 },
  calories: { min: 0, max: 5000 },
  sleep: { min: 0, max: 12 },
  hydration: { min: 0, max: 20 },
  blood_glucose: { min: 40, max: 300 }
};

const EXPECTED_METRICS = ['steps', 'heart_rate', 'calories', 'sleep', 'hydration', 'blood_glucose'];

/**
 * Validate a single data point
 * @param {Object} point - Data point to validate
 * @throws {Error} If validation fails
 */
function validateDataPoint(point) {
  if (!point.metric_type) {
    throw new Error('Missing metric_type in data point');
  }

  if (point.value === undefined || point.value === null) {
    throw new Error(`Missing value for metric ${point.metric_type}`);
  }

  if (!point.timestamp || !(point.timestamp instanceof Date)) {
    throw new Error(`Invalid timestamp for metric ${point.metric_type}`);
  }

  if (!VALID_RANGES[point.metric_type]) {
    throw new Error(`Unknown metric type: ${point.metric_type}`);
  }

  validateDataRange(point.metric_type, point.value);
}

/**
 * Validate value is within valid range for metric type
 * @param {string} metricType - Type of metric
 * @param {number} value - Value to validate
 * @throws {Error} If value is outside valid range
 */
function validateDataRange(metricType, value) {
  const range = VALID_RANGES[metricType];

  if (value < range.min || value > range.max) {
    throw new Error(
      `${metricType} value ${value} outside valid range [${range.min}, ${range.max}]`
    );
  }
}

/**
 * Validate complete dataset
 * @param {Array} data - Array of data points
 * @throws {Error} If validation fails
 */
function validateCompleteDataset(data) {
  if (!data || !Array.isArray(data)) {
    throw new Error('Data must be a non-empty array');
  }

  if (data.length === 0) {
    throw new Error('No data generated');
  }

  if (data.length !== 1728) {
    throw new Error(`Expected 1728 data points, got ${data.length}`);
  }

  // Validate each point
  data.forEach((point, index) => {
    try {
      validateDataPoint(point);
    } catch (error) {
      throw new Error(`Invalid data point at index ${index}: ${error.message}`);
    }
  });

  // Verify metric distribution
  const metricCounts = {};
  data.forEach(point => {
    metricCounts[point.metric_type] = (metricCounts[point.metric_type] || 0) + 1;
  });

  // Each metric should have exactly 288 points
  EXPECTED_METRICS.forEach(metric => {
    const count = metricCounts[metric] || 0;
    if (count !== 288) {
      throw new Error(`${metric} has ${count} points, expected 288`);
    }
  });
}

/**
 * Get validation ranges for a metric type
 * @param {string} metricType - Type of metric
 * @returns {Object} {min, max}
 */
function getValidRange(metricType) {
  return VALID_RANGES[metricType];
}

/**
 * Get all expected metrics
 * @returns {Array<string>} Array of metric type strings
 */
function getExpectedMetrics() {
  return [...EXPECTED_METRICS];
}

module.exports = {
  validateDataPoint,
  validateDataRange,
  validateCompleteDataset,
  getValidRange,
  getExpectedMetrics,
  VALID_RANGES,
  EXPECTED_METRICS
};
