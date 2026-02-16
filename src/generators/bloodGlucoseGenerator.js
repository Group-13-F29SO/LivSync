/**
 * Blood Glucose Generator
 * Generates blood glucose data in mg/dL (40-300 range, normal 70-180)
 * Includes post-meal spikes for realistic patterns
 */

const { getTimeOfDay, generateTimestamps } = require('../utils/timeHelpers');
const { addRandomVariance, clamp, smoothValue } = require('../utils/mathHelpers');

class BloodGlucoseGenerator {
  /**
   * Generate blood glucose data for a full day
   * @param {Date} startDate - Start date (will be normalized to 00:00)
   * @returns {Array<Object>} Array of data points
   */
  generate(startDate) {
    const timestamps = generateTimestamps(startDate, 288);
    const data = [];
    let previousGlucose = 85; // Start with normal fasting level

    // Meal times for post-meal spikes
    const mealTimes = {
      breakfast: 7, // 7 AM
      lunch: 12, // 12 PM
      dinner: 18 // 6 PM
    };

    for (let i = 0; i < 288; i++) {
      const minuteOfDay = i * 5;
      const { hour, minute } = getTimeOfDay(minuteOfDay);

      // Get base glucose for this hour
      let glucose = this.getBaseGlucose(hour);

      // Apply post-meal spike if within 1 hour after meal
      glucose = this.applyMealSpike(glucose, hour, minute, mealTimes);

      // Add random variance (±5%)
      glucose = addRandomVariance(glucose, 5);

      // Smooth transitions
      glucose = smoothValue(glucose, previousGlucose, 0.3);

      // Clamp to valid range
      glucose = clamp(Math.round(glucose), 40, 300);

      previousGlucose = glucose;

      data.push({
        metric_type: 'blood_glucose',
        value: glucose,
        timestamp: timestamps[i],
        source: 'simulated'
      });
    }

    return data;
  }

  /**
   * Get base blood glucose for a given hour
   * @param {number} hour - Hour (0-23)
   * @returns {number} Base glucose in mg/dL
   */
  getBaseGlucose(hour) {
    // Based on hourly patterns from specification

    if (hour >= 0 && hour < 6) {
      // Fasting/Night (12-6 AM): 70-100 mg/dL
      return 85 + Math.random() * 15;
    }

    if (hour >= 6 && hour < 9) {
      // Morning/Fasting (6-9 AM): 70-100 mg/dL
      return 85 + Math.random() * 15;
    }

    if (hour >= 9 && hour < 11) {
      // Pre-Lunch (9-11 AM): 100-120 mg/dL
      return 110 + Math.random() * 10;
    }

    if (hour === 11) {
      // Pre-Lunch (11 AM): 100-120 mg/dL
      return 110 + Math.random() * 10;
    }

    if (hour === 12) {
      // Lunch time: handled by meal spike
      return 120 + Math.random() * 20;
    }

    if (hour >= 13 && hour < 17) {
      // Post-Lunch/Afternoon (1-5 PM): 90-120 mg/dL (normalizing)
      return 105 + Math.random() * 15;
    }

    if (hour === 17) {
      // Pre-Dinner (5 PM): 100-120 mg/dL
      return 110 + Math.random() * 10;
    }

    if (hour >= 18 && hour < 20) {
      // Dinner time: handled by meal spike
      return 120 + Math.random() * 20;
    }

    if (hour >= 20 && hour < 24) {
      // Evening/Night (8 PM-12 AM): 80-110 mg/dL
      return 95 + Math.random() * 15;
    }

    return 95; // Default fallback
  }

  /**
   * Apply post-meal spike if within 1 hour after meal
   * @param {number} glucose - Current glucose value
   * @param {number} hour - Current hour
   * @param {number} minute - Current minute
   * @param {Object} mealTimes - Map of meal times
   * @returns {number} Glucose with potential spike applied
   */
  applyMealSpike(glucose, hour, minute, mealTimes) {
    // Check if we're within 1 hour after each meal
    // Meals: breakfast (7 AM), lunch (12 PM), dinner (6 PM)

    const checkMealSpike = (mealHour) => {
      if (
        (hour === mealHour && minute >= 0) ||
        (hour === mealHour + 1 && minute < 60)
      ) {
        // Post-meal spike: peaks 1 hour after meal
        // Spikes from normal 100-120 to 130-180 mg/dL
        const minutesAfterMeal = hour === mealHour ? minute : 60 + minute;
        if (minutesAfterMeal <= 60) {
          // Within meal hour, apply spike
          const spikeIntensity = Math.sin((minutesAfterMeal / 60) * Math.PI);
          return glucose + spikeIntensity * 40 + Math.random() * 20;
        }
      }
      return glucose;
    };

    let result = glucose;

    // Check all meal times
    result = checkMealSpike(mealTimes.breakfast);
    if (result === glucose) result = checkMealSpike(mealTimes.lunch);
    if (result === glucose) result = checkMealSpike(mealTimes.dinner);

    return result;
  }
}

module.exports = BloodGlucoseGenerator;
