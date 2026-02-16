/**
 * Time Helper Utilities for Biometric Data Generation
 * Provides functions to determine time-based patterns for realistic data generation
 */

/**
 * Get time information (hour, minute, period) from minutes since midnight
 * @param {number} minutesSinceMidnight - Minutes elapsed since 00:00
 * @returns {Object} {hour, minute, period}
 */
function getTimeOfDay(minutesSinceMidnight) {
  const hour = Math.floor(minutesSinceMidnight / 60);
  const minute = minutesSinceMidnight % 60;

  let period = 'night';
  if (hour >= 6 && hour < 9) period = 'morning';
  else if (hour >= 9 && hour < 12) period = 'late_morning';
  else if (hour >= 12 && hour < 13) period = 'lunch';
  else if (hour >= 13 && hour < 17) period = 'afternoon';
  else if (hour >= 17 && hour < 20) period = 'evening';
  else if (hour >= 20 && hour < 24) period = 'night_wind_down';

  return { hour, minute, period };
}

/**
 * Get activity level multiplier based on hour of day
 * Used to adjust metrics like heart rate and calories for activity patterns
 * @param {number} hour - Hour (0-23)
 * @returns {number} Activity multiplier (0.8 to 1.5)
 */
function getActivityLevel(hour) {
  // Deterministic pattern based on hour
  if (hour >= 0 && hour < 6) return 0.8; // Sleeping
  if (hour >= 6 && hour < 9) return 1.0; // Morning routine
  if (hour >= 9 && hour < 12) return 1.1; // Commute/work
  if (hour >= 12 && hour < 13) return 1.0; // Lunch
  if (hour >= 13 && hour < 17) return 1.0; // Afternoon work
  if (hour >= 17 && hour < 19) return 1.3; // Exercise time (evening peak)
  if (hour >= 19 && hour < 20) return 1.2; // Evening activity
  if (hour >= 20 && hour < 24) return 0.9; // Wind down

  return 1.0; // Default
}

/**
 * Generate array of timestamps for a full day at 5-minute intervals
 * @param {Date} startDate - Start date (will be set to 00:00)
 * @param {number} dataPoints - Number of data points (default 288 for 24h @ 5min intervals)
 * @returns {Array<Date>} Array of timestamps
 */
function generateTimestamps(startDate, dataPoints = 288) {
  const timestamps = [];
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0); // Ensure we start at midnight

  for (let i = 0; i < dataPoints; i++) {
    const timestamp = new Date(start);
    timestamp.setMinutes(timestamp.getMinutes() + i * 5); // Add 5 minutes per iteration
    timestamps.push(timestamp);
  }

  return timestamps;
}

/**
 * Get minutes elapsed since midnight for a given date
 * @param {Date} date - Date to calculate from
 * @returns {number} Minutes since midnight (0-1439)
 */
function getMinutesSinceMidnight(date) {
  return date.getHours() * 60 + date.getMinutes();
}

/**
 * Get hour value from a date
 * @param {Date} date - Date to extract hour from
 * @returns {number} Hour (0-23)
 */
function getHourOfDay(date) {
  return date.getHours();
}

module.exports = {
  getTimeOfDay,
  getActivityLevel,
  generateTimestamps,
  getMinutesSinceMidnight,
  getHourOfDay
};
