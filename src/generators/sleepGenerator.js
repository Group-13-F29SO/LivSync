/**
 * Sleep Generator
 * Generates variable sleep duration data (6-9 hours per night)
 * Sleep times vary by day of week:
 * - Weekdays: typically 10 PM - 11:30 PM, wake 6-7 AM
 * - Weekends: typically 10 PM - 12 AM, wake 7-8 AM
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

    const dayOfWeek = startDate.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    const dateHash = this.hashDate(startDate);
    
    // Determine THIS NIGHT'S sleep (starting today evening, going into tomorrow morning)
    let totalSleep = 8 + Math.sin(dateHash) * 1; // 7-9 hours
    totalSleep = clamp(totalSleep, 6, 9);

    // Determine sleep start time (bedtime)
    const sleepTimeHash = Math.sin(dateHash * 7.123 + startDate.getDate() * 2.71);
    let sleepStartHour = 22; // 10 PM default
    
    if (isWeekend) {
      // Weekends: more flexible sleep schedule (10 PM - 12 AM)
      sleepStartHour += sleepTimeHash * 2; // Range: ~20-24
    } else {
      // Weekdays: more consistent sleep schedule (10 PM - 11:30 PM)
      sleepStartHour += sleepTimeHash * 1.5; // Range: ~20.5-23.5
    }
    
    sleepStartHour = clamp(sleepStartHour, 22, 24); // Keep between 10 PM and midnight
    const sleepStartMinutes = Math.round(sleepStartHour * 60);

    // Calculate wake time in next day (in minutes from midnight of current day)
    const sleepEndMinutes = sleepStartMinutes + (totalSleep * 60);
    const wakeUpMinutesNextDay = sleepEndMinutes - 1440; // Subtract 24 hours (1440 mins)

    // PREVIOUS NIGHT'S sleep (the sleep that carries into this morning)
    const previousDate = new Date(startDate.getTime() - 86400000);
    const previousDateHash = this.hashDate(previousDate);
    const previousDayOfWeek = previousDate.getDay();
    const previousIsWeekend = previousDayOfWeek === 0 || previousDayOfWeek === 6;

    let previousTotalSleep = 8 + Math.sin(previousDateHash) * 1;
    previousTotalSleep = clamp(previousTotalSleep, 6, 9);

    const previousSleepTimeHash = Math.sin(previousDateHash * 7.123 + previousDate.getDate() * 2.71);
    let previousSleepStartHour = 22;
    
    if (previousIsWeekend) {
      previousSleepStartHour += previousSleepTimeHash * 2;
    } else {
      previousSleepStartHour += previousSleepTimeHash * 1.5;
    }
    
    previousSleepStartHour = clamp(previousSleepStartHour, 22, 24);
    const previousSleepStartMinutes = Math.round(previousSleepStartHour * 60);

    // When does yesterday's sleep end (in today's minutes)?
    const previousSleepEndMinutes = previousSleepStartMinutes + (previousTotalSleep * 60);
    const previousWakeUpMinutesToday = previousSleepEndMinutes - 1440;

    let currentSleep = 0;
    let sleepAccumulating = false;

    for (let i = 0; i < 288; i++) {
      const minuteOfDay = i * 5;

      let isInSleepPeriod = false;
      
      if (minuteOfDay < previousWakeUpMinutesToday) {
        // Morning: continuation of yesterday's sleep until wake time
        isInSleepPeriod = true;
        if (!sleepAccumulating) {
          sleepAccumulating = true;
          // At midnight, calculate how much was already slept
          // Sleep ran from previousSleepStartMinutes to 1440 (midnight)
          const minutesBeforeMidnight = 1440 - previousSleepStartMinutes;
          currentSleep = minutesBeforeMidnight / 60;
        }
        // Continue accumulating until wake time
        currentSleep += 5 / 60;
        currentSleep = Math.min(currentSleep, previousTotalSleep);
      } else if (minuteOfDay >= sleepStartMinutes) {
        // Night: today's sleep starting at bedtime
        isInSleepPeriod = true;
        if (!sleepAccumulating) {
          sleepAccumulating = true;
          currentSleep = 0;
        }
        // Accumulate sleep for the night
        currentSleep += 5 / 60;
        currentSleep = Math.min(currentSleep, totalSleep);
      } else {
        // Awake: either after morning wake-up or before bedtime
        sleepAccumulating = false;
        // currentSleep value stays constant (from morning accumulation)
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
