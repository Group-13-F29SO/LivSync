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
    let cumulativeSteps = 0;

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

      // Ensure non-negative and add to cumulative
      stepsThisPeriod = Math.max(0, stepsThisPeriod);
      cumulativeSteps += stepsThisPeriod;

      // Clamp to max realistic value
      cumulativeSteps = clamp(cumulativeSteps, 0, 20000);

      data.push({
        metric_type: 'steps',
        value: Math.round(cumulativeSteps),
        timestamp: timestamps[i],
        source: 'simulated'
      });
    }

    return data;
  }

  /**
   * Get base steps for a given hour (12 5-minute intervals per hour)
   * Each hour is divided into 12 x 5-minute periods
   * @param {number} hour - Hour (0-23)
   * @returns {number} Steps for a 5-minute period
   */
  getStepsForHour(hour) {
    // Based on hourly patterns from specification
    // Values are per 5-minute interval (hour total / 12)

    if (hour >= 0 && hour < 6) {
      // Night (0-6 AM): 0-1,000 total = ~7-83 per 5-min
      return Math.random() * 10;
    }

    if (hour >= 6 && hour < 9) {
      // Morning (6-9 AM): 200-500 total = ~17-42 per 5-min
      return 25 + Math.random() * 20;
    }

    if (hour >= 9 && hour < 12) {
      // Late Morning (9 AM-12 PM): 1,500-3,000 = ~125-250 per 5-min
      return 150 + Math.random() * 100;
    }

    if (hour === 12) {
      // Lunch (12-1 PM): 500-1,000 = ~42-83 per 5-min
      return 60 + Math.random() * 25;
    }

    if (hour >= 13 && hour < 17) {
      // Afternoon (1-5 PM): 2,000-4,000 = ~167-333 per 5-min
      return 220 + Math.random() * 120;
    }

    if (hour >= 17 && hour < 20) {
      // Evening (5-8 PM): 2,000-3,500 = ~167-292 per 5-min
      return 200 + Math.random() * 100;
    }

    if (hour >= 20 && hour < 24) {
      // Night (8 PM-midnight): 0-500 = ~0-42 per 5-min
      return Math.random() * 40;
    }

    return 50; // Default fallback
  }
}

module.exports = StepsGenerator;
