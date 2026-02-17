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

    // Fetch steps data, sorted by timestamp
    const stepsData = await prisma.biometric_data.findMany({
      where: {
        patient_id: patientId,
        metric_type: 'steps'
      },
      orderBy: {
        timestamp: 'asc'
      },
      take: 100 // Limit to last 100 readings
    });

    if (!stepsData || stepsData.length === 0) {
      return new Response(
        JSON.stringify({ 
          data: [],
          message: 'No steps data available'
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Transform the data for the chart
    const chartData = stepsData.map(item => ({
      timestamp: new Date(item.timestamp).toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      value: Number(item.value),
      rawTime: item.timestamp,
      date: new Date(item.timestamp).toLocaleDateString()
    }));

    // Calculate statistics
    const values = stepsData.map(item => Number(item.value));
    const total = values.reduce((a, b) => a + b, 0);
    const average = (total / values.length).toFixed(0);
    const max = Math.max(...values);
    const min = Math.min(...values);

    // Calculate goal achievement (assuming 10,000 steps goal)
    const goal = 10000;
    const goalAchievement = values.filter(v => v >= goal).length;
    const goalPercentage = ((goalAchievement / values.length) * 100).toFixed(1);

    return new Response(
      JSON.stringify({
        data: chartData,
        stats: {
          total,
          average: Number(average),
          max,
          min,
          count: values.length,
          goalAchievement,
          goalPercentage: Number(goalPercentage)
        }
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching steps data:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch steps data' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
