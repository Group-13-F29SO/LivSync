/**
 * Heart Rate Generator
 * Generates heart rate data in bpm (40-200 range)
 * Includes realistic patterns with activity spikes
 */

const { getTimeOfDay, generateTimestamps, getActivityLevel } = require('../utils/timeHelpers');
const { addRandomVariance, clamp, smoothValue, applyActivitySpike } = require('../utils/mathHelpers');

class HeartRateGenerator {
  /**
   * Generate heart rate data for a full day
   * @param {Date} startDate - Start date (will be normalized to 00:00)
   * @returns {Array<Object>} Array of data points
   */
  generate(startDate) {
    const timestamps = generateTimestamps(startDate, 288);
    const data = [];
    let previousHR = 65; // Start with resting heart rate

    for (let i = 0; i < 288; i++) {
      const minuteOfDay = i * 5;
      const { hour } = getTimeOfDay(minuteOfDay);

      // Get base heart rate for this hour
      let hr = this.getHeartRateForHour(hour);

      // Apply activity level multiplier
      const activityLevel = getActivityLevel(hour);
      hr = hr + (activityLevel - 1) * 20; // Activity level increases HR

      // Apply occasional activity spikes (20% chance during active hours)
      const spikeChance = activityLevel > 1.0 ? 0.05 : 0.01;
      hr = applyActivitySpike(hr, spikeChance, 1.4);

      // Add random variance (±5%)
      hr = addRandomVariance(hr, 5);

      // Smooth transitions to avoid jumps
      hr = smoothValue(hr, previousHR, 0.4);

      // Clamp to valid range
      hr = clamp(Math.round(hr), 40, 200);

      previousHR = hr;

      data.push({
        metric_type: 'heart_rate',
        value: hr,
        timestamp: timestamps[i],
        source: 'simulated'
      });
    }

    return data;
  }

  /**
   * Get base heart rate for a given hour
   * @param {number} hour - Hour (0-23)
   * @returns {number} Base heart rate in bpm
   */
  getHeartRateForHour(hour) {
    // Based on hourly patterns from specification

    if (hour >= 0 && hour < 6) {
      // Sleeping (12-6 AM): 55-65 bpm
      return 60 + Math.random() * 5;
    }

    if (hour >= 6 && hour < 9) {
      // Morning (6-9 AM): 65-75 bpm (waking, light activity)
      return 70 + Math.random() * 5;
    }

    if (hour >= 9 && hour < 12) {
      // Late Morning (9 AM-12 PM): 70-85 bpm (commute, work)
      return 75 + Math.random() * 10;
    }

    if (hour === 12) {
      // Lunch (12-1 PM): ~75 bpm
      return 75 + Math.random() * 5;
    }

    if (hour >= 13 && hour < 17) {
      // Afternoon (1-5 PM): 65-80 bpm (office work)
      return 72 + Math.random() * 8;
    }

    if (hour >= 17 && hour < 19) {
      // Evening (5-7 PM): 100-140 bpm (exercise time)
      return 120 + Math.random() * 20;
    }

    if (hour >= 19 && hour < 20) {
      // Evening (7-8 PM): 90-110 bpm (cooling down)
      return 100 + Math.random() * 10;
    }

    if (hour >= 20 && hour < 24) {
      // Night (8 PM-12 AM): 65-75 bpm (winding down)
      return 70 + Math.random() * 5;
    }

    return 72; // Default fallback
  }
}

module.exports = HeartRateGenerator;
