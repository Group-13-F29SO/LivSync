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

    // last 14 days including selected date
    const historyStartDate = new Date(selectedDate);
    historyStartDate.setDate(historyStartDate.getDate() - 13);
    historyStartDate.setHours(0, 0, 0, 0);

    const historyEndDate = new Date(selectedDateEnd);

const allSleepData = await prisma.biometric_data.findMany({
  where: {
    patient_id: patientId,
    metric_type: 'sleep',
    source: 'apple_health',
    timestamp: {
      gte: historyStartDate,
      lte: historyEndDate,
    },
  },
      orderBy: {
        timestamp: 'asc',
      },
    });

    function formatLocalDate(date) {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }

    const sleepByDate = {};

    for (const item of allSleepData) {
      const ts = new Date(item.timestamp);
      const dateKey = formatLocalDate(ts);
      const value = Number(item.value);

      if (!Number.isFinite(value)) continue;

      sleepByDate[dateKey] = (sleepByDate[dateKey] || 0) + value;
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
      });

      current.setDate(current.getDate() + 1);
    }

    const selectedDateKey = formatLocalDate(selectedDate);
    const selectedDateSleep = Number((sleepByDate[selectedDateKey] || 0).toFixed(1));

    const sleepValues = chartData.map(item => item.value);
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
