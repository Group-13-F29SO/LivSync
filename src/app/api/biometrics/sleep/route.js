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

    // Fetch sleep data, sorted by timestamp
    const sleepData = await prisma.biometric_data.findMany({
      where: {
        patient_id: patientId,
        metric_type: 'sleep'
      },
      orderBy: {
        timestamp: 'asc'
      },
      take: 100 // Limit to last 100 readings
    });

    if (!sleepData || sleepData.length === 0) {
      return new Response(
        JSON.stringify({ 
          data: [],
          message: 'No sleep data available'
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Transform the data for the chart
    const chartData = sleepData.map(item => ({
      timestamp: new Date(item.timestamp).toLocaleDateString([], { 
        month: 'short',
        day: 'numeric'
      }),
      value: Number(item.value),
      rawTime: item.timestamp,
      date: new Date(item.timestamp).toLocaleDateString()
    }));

    // Calculate statistics
    const values = sleepData.map(item => Number(item.value));
    const total = values.reduce((a, b) => a + b, 0);
    const average = (total / values.length).toFixed(1);
    const max = Math.max(...values);
    const min = Math.min(...values);

    // Calculate sleep quality metrics
    const recommendedMin = 7;
    const recommendedMax = 9;
    const optimalSleep = values.filter(v => v >= recommendedMin && v <= recommendedMax).length;
    const optimalPercentage = ((optimalSleep / values.length) * 100).toFixed(1);
    
    // Get latest reading
    const latest = values[values.length - 1] || 0;

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
          optimalSleep,
          optimalPercentage: Number(optimalPercentage)
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
