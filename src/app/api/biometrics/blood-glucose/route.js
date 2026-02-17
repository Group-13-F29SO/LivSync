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

    // Fetch blood glucose data, sorted by timestamp
    const bloodGlucoseData = await prisma.biometric_data.findMany({
      where: {
        patient_id: patientId,
        metric_type: 'blood_glucose'
      },
      orderBy: {
        timestamp: 'asc'
      },
      take: 100 // Limit to last 100 readings
    });

    if (!bloodGlucoseData || bloodGlucoseData.length === 0) {
      return new Response(
        JSON.stringify({ 
          data: [],
          message: 'No blood glucose data available'
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Transform the data for the chart
    const chartData = bloodGlucoseData.map(item => ({
      timestamp: new Date(item.timestamp).toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      value: Number(item.value),
      rawTime: item.timestamp
    }));

    // Calculate statistics
    const values = bloodGlucoseData.map(item => Number(item.value));
    const average = (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1);
    const max = Math.max(...values);
    const min = Math.min(...values);

    return new Response(
      JSON.stringify({
        data: chartData,
        stats: {
          average: Number(average),
          max,
          min,
          count: values.length
        }
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching blood glucose data:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch blood glucose data' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
