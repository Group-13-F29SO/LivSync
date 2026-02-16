/**
 * Sleep Generator
 * Generates sleep duration data (0-8 hours per day)
 * Sleep accumulates during night hours (10 PM - 6 AM), stays constant during day
 */

const { generateTimestamps } = require('../utils/timeHelpers');
const { addRandomVariance, clamp, roundTo } = require('../utils/mathHelpers');

class SleepGenerator {
  /**
   * Generate sleep data for a full day
   * @param {Date} startDate - Start date (will be normalized to 00:00)
   * @returns {Array<Object>} Array of data points
   */
  generate(startDate) {
    const timestamps = generateTimestamps(startDate, 288);
    const data = [];

    // Determine total sleep for the day (±1 hour variance from 8 hours)
    // This is deterministic based on date to ensure consistency
    const dateHash = this.hashDate(startDate);
    let totalSleep = 8 + Math.sin(dateHash) * 1; // 7-9 hours
    totalSleep = clamp(totalSleep, 6, 9);

    // Sleep occurs from 10 PM to 6 AM (8 hours potential)
    // 10 PM = 22:00 = 1320 minutes (264 data points from 22:00 - 5:55)
    // 6 AM = 06:00 = 360 minutes (start of awake period)
    const sleepStart = 1320; // 22:00 (10 PM)
    const sleepEnd = 360; // 06:00 (6 AM next day = minute 360)

    let currentSleep = 0;
    let sleepAccumulating = false;

    for (let i = 0; i < 288; i++) {
      const minuteOfDay = i * 5;

      // Check if we're in sleep period
      // Sleep goes from 10 PM to 6 AM (wraps around midnight)
      const isInSleepPeriod = minuteOfDay >= sleepStart || minuteOfDay < sleepEnd;

      if (isInSleepPeriod) {
        // Accumulate sleep during sleep hours
        if (!sleepAccumulating) {
          sleepAccumulating = true;
          currentSleep = 0;
        }

        // Each 5-minute interval = 5/60 hours = 0.0833 hours
        currentSleep += 5 / 60;
        currentSleep = Math.min(currentSleep, totalSleep);
      } else {
        // Sleep stays constant during waking hours
        sleepAccumulating = false;
      }

      data.push({
        metric_type: 'sleep',
        value: roundTo(currentSleep, 2),
        timestamp: timestamps[i],
        source: 'simulated'
      });
    }

    return data;
  }

  /**
   * Hash a date to get a consistent random value for sleep variance
   * @param {Date} date - Date to hash
   * @returns {number} Hash value
   */
  hashDate(date) {
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();
    return Math.sin(year * 12.9898 + month * 78.233 + day * 43.14);
  }
}

module.exports = SleepGenerator;
