import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export async function GET(req) {
  try {
    // Get the session from cookies
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('livsync_session');
    
    if (!sessionCookie) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    let session;
    try {
      session = JSON.parse(sessionCookie.value);
    } catch (error) {
      return new Response(
        JSON.stringify({ error: 'Invalid session' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get the patient ID from the session
    const patientId = session.userId;

    // Get optional date parameter (format: YYYY-MM-DD)
    const url = new URL(req.url);
    const dateParam = url.searchParams.get('date');
    
    // Determine the date range to fetch
    let targetDate = new Date();
    if (dateParam) {
      targetDate = new Date(dateParam + 'T00:00:00');
    }
    
    // For a given date, we need data from the previous night (10 PM onwards) through the morning
    // So we fetch from the previous day at 10 PM to the current day at 10 AM
    const startDate = new Date(targetDate);
    startDate.setDate(startDate.getDate() - 1);
    startDate.setHours(22, 0, 0, 0); // Previous day 10 PM
    
    const endDate = new Date(targetDate);
    endDate.setHours(10, 0, 0, 0); // Current day 10 AM

    // Fetch sleep data for the specific date range
    const sleepData = await prisma.biometric_data.findMany({
      where: {
        patient_id: patientId,
        metric_type: 'sleep',
        timestamp: {
          gte: startDate,
          lt: endDate
        }
      },
      orderBy: {
        timestamp: 'asc'
      }
    });

    // Also fetch the last 14 days for the history chart
    const historyStartDate = new Date(targetDate);
    historyStartDate.setDate(historyStartDate.getDate() - 14);
    historyStartDate.setHours(22, 0, 0, 0); // 14 days ago at 10 PM
    
    const historyEndDate = new Date(targetDate);
    historyEndDate.setHours(10, 0, 0, 0); // Up to today at 10 AM

    const allSleepData = await prisma.biometric_data.findMany({
      where: {
        patient_id: patientId,
        metric_type: 'sleep',
        timestamp: {
          gte: historyStartDate,
          lt: historyEndDate
        }
      },
      orderBy: {
        timestamp: 'asc'
      }
    });

    if (!sleepData || sleepData.length === 0) {
      return new Response(
        JSON.stringify({ 
          data: [],
          selectedDate: targetDate.toISOString().split('T')[0],
          message: 'No sleep data available for this date'
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // For the selected date, find the final accumulated sleep value
    // But ONLY if we have actually synced data for this date (morning timestamps)
    let selectedDateSleep = 0;
    let hasMorningData = false;
    
    // Check if we have data from the morning of the selected date (0-10 AM)
    // This confirms that data syncing has occurred
    for (const item of sleepData) {
      const hour = new Date(item.timestamp).getHours();
      if (hour < 10) {
        hasMorningData = true;
        // Get the final accumulated sleep value from morning
        selectedDateSleep = Number(item.value);
      }
    }

    // If no morning data, don't show any sleep for this date
    if (!hasMorningData) {
      selectedDateSleep = 0;
    }

    // Organize all sleep data by date for the history chart
    // IMPORTANT: Only include a date if we have morning data (0-10 AM) from that date
    // This ensures we only show complete sleep sessions where syncing has occurred
    const sleepByDate = {};
    const datesWithMorningData = new Set();
    
    // First pass: identify dates that have morning data (confirming sync occurred)
    for (const item of allSleepData) {
      const timestamp = new Date(item.timestamp);
      const hour = timestamp.getHours();
      
      if (hour < 10) {
        // This is morning data - mark this date as having confirmed sync
        const dateKey = timestamp.toISOString().split('T')[0];
        datesWithMorningData.add(dateKey);
      }
    }
    
    // Second pass: only store sleep data for dates that have morning data
    for (const item of allSleepData) {
      const timestamp = new Date(item.timestamp);
      const hour = timestamp.getHours();
      const value = Number(item.value);
      
      // Determine which day this sleep belongs to
      let dateKey;
      if (hour < 10) {
        // This is morning - belongs to current date
        dateKey = timestamp.toISOString().split('T')[0];
      } else {
        // This is evening/night - skip as it's incomplete
        continue;
      }
      
      // Only add sleep data for dates that have morning data (confirmed sync)
      if (datesWithMorningData.has(dateKey)) {
        // Store the final accumulated sleep value for each day
        if (!sleepByDate[dateKey] || value > (sleepByDate[dateKey].value || 0)) {
          sleepByDate[dateKey] = {
            date: timestamp,
            value: value,
            dateStr: timestamp.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          };
        }
      }
    }

    // Convert to array and sort
    const chartData = Object.values(sleepByDate)
      .sort((a, b) => a.date - b.date)
      .map(item => ({
        date: item.dateStr,
        value: parseFloat(item.value.toFixed(1)),
        rawDate: item.date
      }));

    // Calculate statistics from the history data
    const sleepValues = chartData.map(item => item.value);
    const recommendedMin = 7;
    const recommendedMax = 9;
    
    const average = sleepValues.length > 0 
      ? parseFloat((sleepValues.reduce((a, b) => a + b, 0) / sleepValues.length).toFixed(1))
      : 0;
    const max = sleepValues.length > 0 ? Math.max(...sleepValues) : 0;
    const min = sleepValues.length > 0 ? Math.min(...sleepValues) : 0;
    
    const optimalNights = sleepValues.filter(v => v >= recommendedMin && v <= recommendedMax).length;
    const optimalPercentage = sleepValues.length > 0 
      ? parseFloat(((optimalNights / sleepValues.length) * 100).toFixed(1))
      : 0;

    // Fetch the user's sleep goal
    const sleepGoal = await prisma.goals.findFirst({
      where: {
        patient_id: patientId,
        metric_type: 'sleep'
      },
      select: {
        target_value: true
      }
    });

    const goal = sleepGoal?.target_value || 8; // Default to 8 hours if no goal set

    // Calculate current progress (percentage of recommended sleep)
    const currentProgress = Math.min((selectedDateSleep / goal) * 100, 100);

    return new Response(
      JSON.stringify({
        data: chartData,
        selectedDate: targetDate.toISOString().split('T')[0],
        stats: {
          latest: parseFloat(selectedDateSleep.toFixed(1)),
          average,
          max,
          min,
          count: sleepValues.length,
          optimalNights,
          optimalPercentage,
          currentProgress: parseFloat(currentProgress.toFixed(1)),
          recommendedMin,
          recommendedMax,
          goal,
          goalAchieved: selectedDateSleep >= goal
        }
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching sleep data:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch sleep data' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
