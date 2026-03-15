import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');
    const period = searchParams.get('period') || 'today';
    const dateParam = searchParams.get('date');
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');

    // Validation
    if (!patientId) {
      return NextResponse.json(
        { error: 'Patient ID is required' },
        { status: 400 }
      );
    }

    // Get the provider from session to verify access
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('livsync_session');
    
    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    let session;
    try {
      session = JSON.parse(sessionCookie.value);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      );
    }

    const providerId = session.userId;

    // Verify that the provider has access to this patient
    const patient = await prisma.patients.findFirst({
      where: {
        id: patientId,
        provider_id: providerId,
      },
    });

    if (!patient) {
      return NextResponse.json(
        { error: 'Patient not found or access denied' },
        { status: 404 }
      );
    }

    // Calculate date range based on period
    const now = new Date();
    let startDate = new Date(now);
    let endDate = new Date(now);
    endDate.setHours(23, 59, 59, 999);

    switch (period) {
      case '7days':
        startDate.setDate(startDate.getDate() - 6);
        startDate.setHours(0, 0, 0, 0);
        break;
      case '30days':
        startDate.setDate(startDate.getDate() - 29);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'all':
        if (startDateParam && endDateParam) {
          const parsedStart = new Date(startDateParam);
          const parsedEnd = new Date(endDateParam);

          if (isNaN(parsedStart.getTime()) || isNaN(parsedEnd.getTime())) {
            return NextResponse.json(
              { error: 'Invalid date range' },
              { status: 400 }
            );
          }

          startDate = new Date(parsedStart);
          startDate.setHours(0, 0, 0, 0);

          endDate = new Date(parsedEnd);
          endDate.setHours(23, 59, 59, 999);
        } else {
          startDate = new Date(0);
        }
        break;
      case 'today':
      default:
        if (dateParam) {
          const [year, month, day] = dateParam.split('-').map(Number);
          startDate = new Date(year, month - 1, day, 0, 0, 0, 0);
          endDate = new Date(year, month - 1, day, 23, 59, 59, 999);
        } else {
          startDate.setHours(0, 0, 0, 0);
        }
        break;
    }

    // Fetch heart rate data for the date range
    const heartRateData = await prisma.biometric_data.findMany({
      where: {
        patient_id: patientId,
        metric_type: 'heart_rate',
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        timestamp: 'asc',
      },
    });

    if (!heartRateData || heartRateData.length === 0) {
      return NextResponse.json({
        data: [],
        message: 'No heart rate data available',
        stats: null,
        chartType: 'area',
        useRangeBar: false,
      });
    }

    // Determine aggregation interval based on date range
    const daysDiff = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
    let chartType = 'area';
    let useRangeBar = false;
    let chartData;

    // Single day: show raw data
    if (daysDiff < 1 || period === 'today') {
      chartData = heartRateData.map((item) => {
        const timestamp = new Date(item.timestamp);
        const displayTimestamp = timestamp.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        });

        return {
          timestamp: displayTimestamp,
          value: parseFloat(item.value),
        };
      });
    } 
    // Multi-day: aggregate by day
    else {
      const buckets = new Map();

      heartRateData.forEach((item) => {
        const timestamp = new Date(item.timestamp);
        const year = timestamp.getFullYear();
        const month = String(timestamp.getMonth() + 1).padStart(2, '0');
        const date = String(timestamp.getDate()).padStart(2, '0');
        const dateKey = `${year}-${month}-${date}`;

        if (!buckets.has(dateKey)) {
          buckets.set(dateKey, {
            sum: 0,
            count: 0,
            min: Infinity,
            max: -Infinity,
            timestamp,
          });
        }

        const bucket = buckets.get(dateKey);
        const value = parseFloat(item.value);
        bucket.sum += value;
        bucket.count += 1;
        bucket.min = Math.min(bucket.min, value);
        bucket.max = Math.max(bucket.max, value);
      });

      // Generate all dates in range
      const allDates = [];
      const currentDate = new Date(startDate);
      while (currentDate <= endDate) {
        const year = currentDate.getFullYear();
        const month = String(currentDate.getMonth() + 1).padStart(2, '0');
        const date = String(currentDate.getDate()).padStart(2, '0');
        const dateKey = `${year}-${month}-${date}`;
        allDates.push(dateKey);
        currentDate.setDate(currentDate.getDate() + 1);
      }

      chartData = allDates.map((dateKey) => {
        const [year, month, day] = dateKey.split('-').map(Number);
        const dateObj = new Date(year, month - 1, day);

        let displayTimestamp;
        if (daysDiff > 30) {
          displayTimestamp = dateObj.toLocaleDateString([], { month: 'short', day: 'numeric' });
        } else {
          const weekday = dateObj.toLocaleDateString([], { weekday: 'short' });
          const formattedDate = dateObj.toLocaleDateString([], { month: 'numeric', day: 'numeric' });
          displayTimestamp = `${weekday} ${formattedDate}`;
        }

        const bucket = buckets.get(dateKey);

        if (bucket && bucket.count > 0) {
          return {
            timestamp: displayTimestamp,
            average: Math.round((bucket.sum / bucket.count) * 10) / 10,
            min: bucket.min,
            max: bucket.max,
            count: bucket.count,
          };
        } else {
          return {
            timestamp: displayTimestamp,
            average: null,
            min: null,
            max: null,
            count: 0,
          };
        }
      });

      chartType = 'bar';
      useRangeBar = true;
    }

    // Calculate stats
    const values = heartRateData.map(d => parseFloat(d.value));
    const stats = {
      min: Math.min(...values),
      max: Math.max(...values),
      average: Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10,
      count: values.length,
    };

    return NextResponse.json({
      data: chartData,
      stats,
      chartType,
      useRangeBar,
      selectedDate: dateParam || new Date().toISOString().split('T')[0],
    });
  } catch (error) {
    console.error('Error fetching heart rate data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch heart rate data' },
      { status: 500 }
    );
  }
}
