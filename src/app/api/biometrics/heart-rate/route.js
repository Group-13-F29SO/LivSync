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

    // Build local day boundaries (00:00 -> 23:59:59.999)
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    // Fetch heart rate data for the current day, sorted by timestamp
    const heartRateData = await prisma.biometric_data.findMany({
      where: {
        patient_id: patientId,
        metric_type: 'heart_rate',
        timestamp: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      orderBy: {
        timestamp: 'asc'
      }
    });

    if (!heartRateData || heartRateData.length === 0) {
      return new Response(
        JSON.stringify({ 
          data: [],
          message: 'No heart rate data available'
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const MAX_CHART_POINTS = 100;
    const intervalCandidates = [15, 30, 45, 60];

    const selectedInterval = intervalCandidates.find((minutes) => {
      const intervalMs = minutes * 60 * 1000;
      const bucketCount = Math.ceil((endOfDay.getTime() - startOfDay.getTime()) / intervalMs);
      return bucketCount <= MAX_CHART_POINTS;
    }) || 60;

    const intervalMs = selectedInterval * 60 * 1000;
    const buckets = new Map();

    heartRateData.forEach((item) => {
      const timestamp = new Date(item.timestamp);
      const bucketIndex = Math.floor((timestamp.getTime() - startOfDay.getTime()) / intervalMs);

      if (!buckets.has(bucketIndex)) {
        buckets.set(bucketIndex, {
          sum: 0,
          count: 0,
          timestamp
        });
      }

      const bucket = buckets.get(bucketIndex);
      bucket.sum += Number(item.value);
      bucket.count += 1;
      if (timestamp < bucket.timestamp) {
        bucket.timestamp = timestamp;
      }
    });

    const chartData = [...buckets.entries()]
      .sort((a, b) => a[0] - b[0])
      .slice(0, MAX_CHART_POINTS)
      .map(([, bucket]) => ({
        timestamp: bucket.timestamp.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit'
        }),
        value: Number((bucket.sum / bucket.count).toFixed(1)),
        rawTime: bucket.timestamp
      }));

    // Calculate statistics
    const values = heartRateData.map(item => Number(item.value));
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
        },
        intervalMinutes: selectedInterval
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching heart rate data:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch heart rate data' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
