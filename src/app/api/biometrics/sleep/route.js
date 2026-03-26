import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export async function GET(req) {
  try {
    const cookieStore = cookies();
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
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid session' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const patientId = session.userId;

    const url = new URL(req.url);
    const dateParam = url.searchParams.get('date');

    const targetDate = dateParam ? new Date(`${dateParam}T00:00:00`) : new Date();
    if (isNaN(targetDate.getTime())) {
      return new Response(
        JSON.stringify({ error: 'Invalid date' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const selectedDate = new Date(targetDate);
    selectedDate.setHours(0, 0, 0, 0);

    const selectedDateEnd = new Date(selectedDate);
    selectedDateEnd.setHours(23, 59, 59, 999);

    // Fetch all sleep data to determine history window dynamically
    const allSleepData = await prisma.biometric_data.findMany({
      where: {
        patient_id: patientId,
        metric_type: 'sleep',
        timestamp: {
          lte: selectedDateEnd,
        },
      },
      orderBy: {
        timestamp: 'asc',
      },
    });

    // Determine the history window based on available data (min 14 days, or all available)
    let historyStartDate;
    if (allSleepData.length === 0) {
      // No data yet, show last 14 days as default window
      historyStartDate = new Date(selectedDate);
      historyStartDate.setDate(historyStartDate.getDate() - 13);
    } else {
      // Show from earliest data or 14 days, whichever is more recent
      const earliestDate = new Date(allSleepData[0].timestamp);
      earliestDate.setHours(0, 0, 0, 0);
      const fourteenDaysAgo = new Date(selectedDate);
      fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 13);
      
      // Use whichever is earlier (to show more history if available)
      historyStartDate = earliestDate < fourteenDaysAgo ? earliestDate : fourteenDaysAgo;
    }
    historyStartDate.setHours(0, 0, 0, 0);

    const historyEndDate = new Date(selectedDateEnd);

    function formatLocalDate(date) {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }

    const sleepByDate = {};
    const manualByDate = {};

    for (const item of allSleepData) {
      const ts = new Date(item.timestamp);
      
      // Only process data within the display window
      if (ts < historyStartDate || ts > historyEndDate) {
        continue;
      }

      const dateKey = formatLocalDate(ts);
      const value = Number(item.value);

      if (!Number.isFinite(value)) continue;

      // For manual entries, always prioritize them over synced data
      if (item.is_user_entered) {
        sleepByDate[dateKey] = value;
        manualByDate[dateKey] = true;
      } else if (!manualByDate[dateKey]) {
        // For synced data, only update if no manual entry exists
        // Always take the maximum value since the generator stores cumulative hourly updates
        sleepByDate[dateKey] = Math.max(sleepByDate[dateKey] || 0, value);
      }
    }

    const chartData = [];
    const current = new Date(historyStartDate);

    while (current <= historyEndDate) {
      const dateKey = formatLocalDate(current);
      const totalSleep = sleepByDate[dateKey] || 0;

      chartData.push({
        date: current.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        value: Number(totalSleep.toFixed(1)),
        rawDate: new Date(current),
        is_user_entered: !!manualByDate[dateKey],
      });

      current.setDate(current.getDate() + 1);
    }

    const selectedDateKey = formatLocalDate(selectedDate);
    const selectedDateSleep = Number((sleepByDate[selectedDateKey] || 0).toFixed(1));

    // Only include days that actually have sleep data (exclude zeros)
    const sleepValues = chartData.map(item => item.value).filter(v => v > 0);
    const recommendedMin = 7;
    const recommendedMax = 9;

    const average = sleepValues.length > 0
      ? Number((sleepValues.reduce((a, b) => a + b, 0) / sleepValues.length).toFixed(1))
      : 0;

    const max = sleepValues.length > 0 ? Math.max(...sleepValues) : 0;
    const min = sleepValues.length > 0 ? Math.min(...sleepValues) : 0;

    const optimalNights = sleepValues.filter(v => v >= recommendedMin && v <= recommendedMax).length;
    const optimalPercentage = sleepValues.length > 0
      ? Number(((optimalNights / sleepValues.length) * 100).toFixed(1))
      : 0;

    const currentProgress = Math.min((selectedDateSleep / recommendedMax) * 100, 100);

    // Fetch user's goal for this metric
    let goal = null;
    const userGoal = await prisma.goals.findFirst({
      where: {
        patient_id: patientId,
        metric_type: 'sleep',
      },
      select: { target_value: true },
    });
    goal = userGoal?.target_value || null;

    return new Response(
      JSON.stringify({
        data: chartData,
        selectedDate: selectedDateKey,
        stats: {
          latest: selectedDateSleep,
          average,
          max,
          min,
          count: sleepValues.length,
          optimalNights,
          optimalPercentage,
          currentProgress: Number(currentProgress.toFixed(1)),
          recommendedMin,
          recommendedMax,
          goalAchieved: goal ? selectedDateSleep >= goal : false,
          goal: goal,
        },
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