/**
 * Steps Generator
 * Generates cumulative step count data (0-20,000 per day)
 * Steps increase throughout the day based on activity patterns
 */

const { getTimeOfDay, generateTimestamps, getActivityLevel } = require('../utils/timeHelpers');
const { addRandomVariance, clamp } = require('../utils/mathHelpers');

class StepsGenerator {
  /**
   * Generate steps data for a full day
   * @param {Date} startDate - Start date (will be normalized to 00:00)
   * @returns {Array<Object>} Array of data points
   */
  generate(startDate) {
    const timestamps = generateTimestamps(startDate, 288);
    const data = [];

    for (let i = 0; i < 288; i++) {
      const minuteOfDay = i * 5;
      const { hour } = getTimeOfDay(minuteOfDay);

      // Get base steps for this hour
      let stepsThisPeriod = this.getStepsForHour(hour);

      // Apply activity level multiplier
      const activityLevel = getActivityLevel(hour);
      stepsThisPeriod = stepsThisPeriod * activityLevel;

      // Add random variance (±10%)
      stepsThisPeriod = addRandomVariance(stepsThisPeriod, 10);

      // Ensure non-negative
      stepsThisPeriod = Math.max(0, stepsThisPeriod);

      // Clamp to reasonable per-interval value
      stepsThisPeriod = clamp(stepsThisPeriod, 0, 500);

      data.push({
        metric_type: 'steps',
        value: Math.round(stepsThisPeriod),
        timestamp: timestamps[i],
        source: 'simulated'
      });
    }

    return data;
  }

  /**
   * Get base steps for a given hour (12 5-minute intervals per hour)
   * Each hour is divided into 12 x 5-minute periods
   * Realistic daily totals: 8,000-15,000 steps (occasionally up to 20,000)
   * @param {number} hour - Hour (0-23)
   * @returns {number} Steps for a 5-minute period
   */
  getStepsForHour(hour) {
    // Based on hourly patterns from specification
    // Values are per 5-minute interval (hour total / 12)
    // Daily targets: 8k-15k steps (most people), occasional 20k

    if (hour === 0) {
      // Midnight (12-1 AM): User might still be awake or slept late
      // 70% chance of 0 steps (sleeping), 30% chance of 10-15 steps
      return Math.random() < 0.7 ? 0 : (10 + Math.random() * 5) / 12;
    }

    if (hour >= 1 && hour < 6) {
      // Night (1-6 AM): Sleep time
      // Most hours should be 0 steps, occasionally some for bathroom breaks
      const probability = Math.random();
      if (probability < 0.85) {
        // 85% chance: sleeping, 0 steps
        return 0;
      } else {
        // 15% chance: woke up for bathroom or brief activity (10-15 steps per hour)
        return (10 + Math.random() * 5) / 12;
      }
    }

    if (hour >= 6 && hour < 9) {
      // Morning (6-9 AM): Getting ready, light activity
      return 5 + Math.random() * 5;
    }

    if (hour >= 9 && hour < 12) {
      // Late Morning (9 AM-12 PM): Work/activity
      return 30 + Math.random() * 20;
    }

    if (hour === 12) {
      // Lunch (12-1 PM): Moderate activity
      return 15 + Math.random() * 10;
    }

    if (hour >= 13 && hour < 17) {
      // Afternoon (1-5 PM): Most active period
      return 40 + Math.random() * 30;
    }

    if (hour >= 17 && hour < 20) {
      // Evening (5-8 PM): Exercise/activity time
      return 35 + Math.random() * 25;
    }

    if (hour >= 20 && hour < 24) {
      // Night (8 PM-midnight): Winding down
      return Math.random() * 5;
    }

    return 20; // Default fallback
  }
}

module.exports = StepsGenerator;
