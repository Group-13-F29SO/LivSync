/**
 * Hydration Generator
 * Generates hydration data in glasses of water (4-12 per day)
 * Discrete metric - water intake logged at specific times
 */

const { getTimeOfDay, generateTimestamps } = require('../utils/timeHelpers');
const { clamp } = require('../utils/mathHelpers');

class HydrationGenerator {
  /**
   * Generate hydration data for a full day
   * @param {Date} startDate - Start date (will be normalized to 00:00)
   * @returns {Array<Object>} Array of data points
   */
  generate(startDate) {
    const timestamps = generateTimestamps(startDate, 288);
    const data = [];

    // Determine total glasses for the day (6-10, recommended 8)
    const dateHash = this.hashDate(startDate);
    let totalGlasses = 8 + Math.sin(dateHash) * 2; // 6-10 glasses
    totalGlasses = clamp(Math.round(totalGlasses), 6, 10);

    // Distribute glasses throughout the day
    const glassDistribution = this.distributeGlasses(totalGlasses);

    let cumulativeGlasses = 0;

    for (let i = 0; i < 288; i++) {
      const minuteOfDay = i * 5;
      const { hour } = getTimeOfDay(minuteOfDay);

      // Add glasses if this is a drinking time for this hour
      if (glassDistribution[hour] > 0 && minuteOfDay % 60 === 0) {
        // Only add at the start of certain hours
        const glassesThisHour = glassDistribution[hour];
        cumulativeGlasses += glassesThisHour;
        glassDistribution[hour] = 0; // Mark as distributed
      }

      cumulativeGlasses = clamp(cumulativeGlasses, 0, 20);

      data.push({
        metric_type: 'hydration',
        value: Math.round(cumulativeGlasses),
        timestamp: timestamps[i],
        source: 'simulated'
      });
    }

    return data;
  }

  /**
   * Distribute total glasses across hours of the day
   * @param {number} totalGlasses - Total glasses to distribute
   * @returns {Object} Map of hour -> glasses for that hour
   */
  distributeGlasses(totalGlasses) {
    const distribution = {};

    // Initialize all hours
    for (let h = 0; h < 24; h++) {
      distribution[h] = 0;
    }

    // Distribute based on activity patterns
    const glasses = totalGlasses;
    let remaining = glasses;

    // Morning (6-9 AM): 1-2 glasses
    distribution[6] = Math.min(Math.ceil(remaining / 6), 2);
    remaining -= distribution[6];

    // Late Morning (9 AM-12 PM): 1-2 glasses
    distribution[10] = Math.min(Math.ceil(remaining / 5), 2);
    remaining -= distribution[10];

    // Lunch (12-1 PM): 1 glass
    distribution[12] = Math.min(1, remaining);
    remaining -= distribution[12];

    // Afternoon (1-5 PM): 2-3 glasses (spread)
    distribution[14] = Math.min(Math.ceil(remaining / 3), 2);
    remaining -= distribution[14];

    distribution[16] = Math.min(Math.ceil(remaining / 2), 2);
    remaining -= distribution[16];

    // Evening (5-8 PM): 1-2 glasses
    distribution[18] = Math.min(Math.ceil(remaining / 2), 2);
    remaining -= distribution[18];

    // Remaining gets added back
    distribution[14] += remaining;

    return distribution;
  }

  /**
   * Hash a date to get a consistent random value
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

module.exports = HydrationGenerator;
