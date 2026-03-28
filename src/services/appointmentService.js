/**
 * Generates available appointment slots for a given date
 * Working hours: 9am-5pm (09:00-17:00)
 * Every 30 minutes
 * Lunch break: 12:30pm-1pm (12:30-13:00)
 * No weekends (Saturday and Sunday)
 */
export const appointmentService = {
  // Get display label for a time slot
  getTimeLabel(timeStr) {
    if (!timeStr || !timeStr.includes(':')) return timeStr;
    const [hour, minutes] = timeStr.split(':');
    const hourNum = parseInt(hour);
    const period = hourNum >= 12 ? 'PM' : 'AM';
    const displayHour = hourNum > 12 ? hourNum - 12 : hourNum === 0 ? 12 : hourNum;
    return `${displayHour}:${minutes} ${period}`;
  },

  // Check if a date is a weekend
  isWeekend(date) {
    const dayOfWeek = new Date(date).getDay();
    return dayOfWeek === 0 || dayOfWeek === 6; // 0 = Sunday, 6 = Saturday
  },

  // Format date for display
  formatDate(date) {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short',
    });
  },

  // Get a list of valid dates (starting from tomorrow, excluding weekends)
  getValidDates(days = 30) {
    const dates = [];
    let currentDate = new Date();
    currentDate.setDate(currentDate.getDate() + 1); // Start from tomorrow

    while (dates.length < days) {
      if (!this.isWeekend(currentDate)) {
        dates.push(new Date(currentDate));
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return dates;
  },

  // Get minimum date (tomorrow or next working day)
  getMinimumDate() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (this.isWeekend(tomorrow)) {
      // If tomorrow is weekend, get next Monday
      const day = tomorrow.getDay();
      const daysToAdd = day === 0 ? 1 : 2; // Sunday -> Monday (1 day), Saturday -> Monday (2 days)
      tomorrow.setDate(tomorrow.getDate() + daysToAdd);
    }

    return tomorrow;
  },

  // Get maximum date (e.g., 30 days from now)
  getMaximumDate(daysAhead = 30) {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + daysAhead);
    return maxDate;
  },

  // Convert time string to 12-hour format
  formatTo12Hour(timeStr) {
    if (!timeStr || !timeStr.includes(':')) return timeStr;
    const [hour, minutes] = timeStr.split(':');
    const hourNum = parseInt(hour);
    const period = hourNum >= 12 ? 'PM' : 'AM';
    const displayHour = hourNum > 12 ? hourNum - 12 : hourNum === 0 ? 12 : hourNum;
    return `${displayHour}:${minutes} ${period}`;
  },

  // Check if time is in lunch break (12:30pm-1pm)
  isLunchBreak(timeStr) {
    return timeStr === '12:30';
  },
};
