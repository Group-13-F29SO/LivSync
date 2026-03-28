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

    // Get the date parameter from the query string
    const { searchParams } = new URL(req.url);
    const selectedDate = searchParams.get('date');
    const getAll = searchParams.get('getAll') === 'true';

    // If getAll is true, fetch all historical data for statistics
    if (getAll) {
      const allHydrationData = await prisma.biometric_data.findMany({
        where: {
          patient_id: patientId,
          metric_type: 'hydration'
        },
        orderBy: {
          timestamp: 'asc'
        }
      });

      if (!allHydrationData || allHydrationData.length === 0) {
        return new Response(
          JSON.stringify({ 
            data: [],
            message: 'No hydration data available',
            historicalStats: null
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Calculate daily totals
      const dailyTotals = {};
      allHydrationData.forEach(item => {
        const date = new Date(item.timestamp).toLocaleDateString();
        if (!dailyTotals[date]) {
          dailyTotals[date] = { total: 0, count: 0, entries: [] };
        }
        dailyTotals[date].total += Number(item.value);
        dailyTotals[date].count += 1;
        dailyTotals[date].entries.push(Number(item.value));
      });

      // Calculate statistics
      const allDailyMaxes = Object.values(dailyTotals).map(d => Math.max(...d.entries));
      const allEntryValues = Object.values(dailyTotals).flatMap(d => d.entries);
      
      const overallAverage = (allDailyMaxes.reduce((a, b) => a + b, 0) / allDailyMaxes.length).toFixed(1);
      const bestDay = Math.max(...allEntryValues);
      const totalDays = allDailyMaxes.length;

      return new Response(
        JSON.stringify({
          historicalStats: {
            overallAverage: Number(overallAverage),
            bestDay,
            totalDays,
            totalEntries: allHydrationData.length
          }
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // If no date is provided, return no data
    if (!selectedDate) {
      return new Response(
        JSON.stringify({ 
          data: [],
          message: 'No date specified',
          stats: null
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Parse the selected date to get start and end of day
    const dateObj = new Date(selectedDate + 'T00:00:00');
    const startOfDay = new Date(dateObj.getTime());
    const endOfDay = new Date(dateObj.getTime() + 24 * 60 * 60 * 1000);

    // Fetch hydration data for the specific date
    const hydrationData = await prisma.biometric_data.findMany({
      where: {
        patient_id: patientId,
        metric_type: 'hydration',
        timestamp: {
          gte: startOfDay,
          lt: endOfDay
        }
      },
      orderBy: {
        timestamp: 'asc'
      }
    });

    if (!hydrationData || hydrationData.length === 0) {
      return new Response(
        JSON.stringify({ 
          data: [],
          message: 'No hydration data available for this date',
          stats: null
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Transform the data for the chart
    const chartData = hydrationData.map(item => ({
      timestamp: new Date(item.timestamp).toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      value: Number(item.value),
      rawTime: item.timestamp,
      date: new Date(item.timestamp).toLocaleDateString()
    }));

    // Calculate statistics
    const values = hydrationData.map(item => Number(item.value));
    const total = values.reduce((a, b) => a + b, 0);
    const average = (total / values.length).toFixed(1);
    const max = Math.max(...values);
    const min = Math.min(...values);

    // Get latest reading for current progress
    const latest = values[values.length - 1] || 0;

    // Fetch the user's water goal
    const waterGoal = await prisma.goals.findFirst({
      where: {
        patient_id: patientId,
        metric_type: 'water'
      },
      select: {
        target_value: true
      }
    });

    const goal = waterGoal?.target_value || 8; // Default to 8 if no goal set
    const goalAchievement = latest >= goal ? 1 : 0;
    const goalPercentage = latest >= goal ? 100 : ((latest / goal) * 100).toFixed(1);
    const currentProgress = ((latest / goal) * 100).toFixed(1);

    return new Response(
      JSON.stringify({
        data: chartData,
        stats: {
          total,
          average: Number(average),
          max,
          min,
          count: values.length,
          latest,
          goalAchievement,
          goalPercentage: Number(goalPercentage),
          currentProgress: Number(currentProgress),
          goal
        }
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching hydration data:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch hydration data' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
