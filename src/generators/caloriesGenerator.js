/**
 * Calories Generator
 * Generates cumulative calories burned data (800-3,500 per day)
 * Correlates with heart rate and activity level
 */

const { getTimeOfDay, generateTimestamps, getActivityLevel } = require('../utils/timeHelpers');
const { addRandomVariance, clamp } = require('../utils/mathHelpers');

class CaloriesGenerator {
  /**
   * Generate calories data for a full day
   * @param {Date} startDate - Start date (will be normalized to 00:00)
   * @returns {Array<Object>} Array of data points
   */
  generate(startDate) {
    const timestamps = generateTimestamps(startDate, 288);
    const data = [];

    for (let i = 0; i < 288; i++) {
      const minuteOfDay = i * 5;
      const { hour } = getTimeOfDay(minuteOfDay);

      // Baseline: ~1 kcal per minute at rest
      let caloriesThisPeriod = 1 * 5; // 5-minute interval

      // Apply activity-based multiplier
      const activityLevel = getActivityLevel(hour);
      caloriesThisPeriod = caloriesThisPeriod * (0.8 + activityLevel * 0.6);

      // Apply bonus during specific high-activity periods
      if ((hour >= 6 && hour < 9) || (hour >= 13 && hour < 17)) {
        // Morning and afternoon work: +0.5-1 kcal/min
        caloriesThisPeriod += Math.random() * 2.5;
      }

      if (hour >= 17 && hour < 20) {
        // Evening exercise (5-8 PM): +2-4 kcal/min
        caloriesThisPeriod += 10 + Math.random() * 10;
      }

      // Add random variance (±8%)
      caloriesThisPeriod = addRandomVariance(caloriesThisPeriod, 8);

      // Ensure positive and clamp to realistic 5-minute maximum
      caloriesThisPeriod = clamp(Math.max(0, caloriesThisPeriod), 0, 30);

      data.push({
        metric_type: 'calories',
        value: Math.round(caloriesThisPeriod),
        timestamp: timestamps[i],
        source: 'simulated'
      });
    }

    return data;
  }
}

module.exports = CaloriesGenerator;
