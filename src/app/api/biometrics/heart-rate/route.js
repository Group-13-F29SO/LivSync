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

    // Get period from query params (default: 'today')
    const url = new URL(req.url);
    const period = url.searchParams.get('period') || 'today';

    // Calculate date range based on period
    const now = new Date();
    let startDate = new Date(now);
    let endDate = new Date(now);
    endDate.setHours(23, 59, 59, 999);

    switch (period) {
      case '7days':
        startDate.setDate(startDate.getDate() - 6); // Include today + 6 previous days
        startDate.setHours(0, 0, 0, 0);
        break;
      case '30days':
        startDate.setDate(startDate.getDate() - 29);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'all':
        startDate = new Date(0); // Fetch from epoch
        break;
      case 'today':
      default:
        startDate.setHours(0, 0, 0, 0);
        break;
    }

    // Fetch heart rate data for the date range
    const heartRateData = await prisma.biometric_data.findMany({
      where: {
        patient_id: patientId,
        metric_type: 'heart_rate',
        timestamp: {
          gte: startDate,
          lte: endDate
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
          message: 'No heart rate data available',
          availableDates: null
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Determine aggregation interval based on date range
    const daysDiff = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
    let aggregationIntervalMs;
    let timeFormatKey;

    if (daysDiff > 30) {
      // Multi-week: aggregate by day
      aggregationIntervalMs = 24 * 60 * 60 * 1000;
      timeFormatKey = 'day';
    } else if (daysDiff > 1) {
      // Multi-day: aggregate by 4-6 hours
      aggregationIntervalMs = 6 * 60 * 60 * 1000;
      timeFormatKey = 'time';
    } else {
      // Single day: use adaptive 15-60 min buckets
      const MAX_CHART_POINTS = 100;
      const intervalCandidates = [15, 30, 45, 60];
      const selectedInterval = intervalCandidates.find((minutes) => {
        const intervalMs = minutes * 60 * 1000;
        const bucketCount = Math.ceil((endDate.getTime() - startDate.getTime()) / intervalMs);
        return bucketCount <= MAX_CHART_POINTS;
      }) || 60;
      aggregationIntervalMs = selectedInterval * 60 * 1000;
      timeFormatKey = 'time';
    }

    // Aggregate data into buckets
    const buckets = new Map();

    heartRateData.forEach((item) => {
      const timestamp = new Date(item.timestamp);
      const bucketIndex = Math.floor((timestamp.getTime() - startDate.getTime()) / aggregationIntervalMs);

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

    // Format chart data
    const chartData = [...buckets.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([, bucket]) => {
        let displayTimestamp;

        if (timeFormatKey === 'day') {
          // Show date for multi-day views
          displayTimestamp = bucket.timestamp.toLocaleDateString([], {
            month: '2-digit',
            day: '2-digit'
          });
        } else {
          // Show time for single/few-day views
          displayTimestamp = bucket.timestamp.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
          });
        }

        return {
          timestamp: displayTimestamp,
          value: Number((bucket.sum / bucket.count).toFixed(1)),
          rawTime: bucket.timestamp
        };
      });

    // Calculate statistics
    const values = heartRateData.map(item => Number(item.value));
    const average = (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1);
    const max = Math.max(...values);
    const min = Math.min(...values);

    // Get earliest and latest dates for available data
    const allDates = await prisma.biometric_data.findMany({
      where: {
        patient_id: patientId,
        metric_type: 'heart_rate'
      },
      select: {
        timestamp: true
      },
      orderBy: [
        { timestamp: 'asc' },
        { timestamp: 'desc' }
      ],
      take: 2
    });

    const availableDates = {
      earliest: allDates.length > 0 ? new Date(allDates[allDates.length - 1].timestamp) : null,
      latest: allDates.length > 0 ? new Date(allDates[0].timestamp) : null
    };

    return new Response(
      JSON.stringify({
        data: chartData,
        stats: {
          average: Number(average),
          max,
          min,
          count: values.length
        },
        period,
        availableDates
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
