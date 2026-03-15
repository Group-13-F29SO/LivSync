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

    // If custom date range is provided, use it regardless of period
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
      // Otherwise, use period-based logic
      switch (period) {
        case 'week':
          const dayOfWeek = now.getDay();
          const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
          startDate.setDate(startDate.getDate() - daysToMonday);
          startDate.setHours(0, 0, 0, 0);
          endDate.setDate(endDate.getDate() + (6 - daysToMonday));
          endDate.setHours(23, 59, 59, 999);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
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
    }

    // Fetch blood glucose data for the date range
    const bloodGlucoseData = await prisma.biometric_data.findMany({
      where: {
        patient_id: patientId,
        metric_type: 'blood_glucose',
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        timestamp: 'asc',
      },
    });

    if (!bloodGlucoseData || bloodGlucoseData.length === 0) {
      return NextResponse.json({
        data: [],
        message: 'No blood glucose data available',
        stats: null,
      });
    }

    // Determine aggregation based on date range
    let chartData;
    const daysDiff = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);

    // Single day: show raw data
    if (daysDiff < 1 || period === 'today') {
      chartData = bloodGlucoseData.map((item) => {
        const timestamp = new Date(item.timestamp);
        const displayTimestamp = timestamp.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        });

        return {
          timestamp: displayTimestamp,
          value: Number(item.value),
        };
      });
    } 
    // Multi-day: aggregate by day
    else {
      const buckets = new Map();

      bloodGlucoseData.forEach((item) => {
        const timestamp = new Date(item.timestamp);
        // Get the date key using local timezone (YYYY-MM-DD)
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
        const value = Number(item.value);
        bucket.sum += value;
        bucket.count += 1;
        bucket.min = Math.min(bucket.min, value);
        bucket.max = Math.max(bucket.max, value);
      });

      // Format chart data from buckets
      // Generate all dates in the range
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

      chartData = allDates
        .map((dateKey) => {
          const [year, month, day] = dateKey.split('-').map(Number);
          const dateObj = new Date(year, month - 1, day);

          let displayTimestamp;
          if (daysDiff > 30) {
            // Show date in format like "Jan 15"
            displayTimestamp = dateObj.toLocaleDateString([], { month: 'short', day: 'numeric' });
          } else {
            // Week period: show weekday and date like "Mon 1/15"
            const weekday = dateObj.toLocaleDateString([], { weekday: 'short' });
            const formattedDate = dateObj.toLocaleDateString([], { month: 'numeric', day: 'numeric' });
            displayTimestamp = `${weekday} ${formattedDate}`;
          }

          const bucket = buckets.get(dateKey);

          if (bucket && bucket.count > 0) {
            return {
              timestamp: displayTimestamp,
              value: Math.round((bucket.sum / bucket.count) * 10) / 10,
              min: bucket.min,
              max: bucket.max,
              count: bucket.count,
              rawDate: dateKey,
              hasData: true,
            };
          } else {
            return {
              timestamp: displayTimestamp,
              value: null,
              min: null,
              max: null,
              count: 0,
              rawDate: dateKey,
              hasData: false,
            };
          }
        });
    }

    // Calculate stats
    const values = bloodGlucoseData.map(d => Number(d.value));
    const stats = {
      min: Math.min(...values),
      max: Math.max(...values),
      average: Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10,
      count: values.length,
    };

    // Determine status based on average
    const getGlucoseStatus = (value) => {
      if (value < 70) return { status: 'Low', color: 'text-yellow-600' };
      if (value >= 70 && value <= 140) return { status: 'Normal', color: 'text-green-600' };
      if (value > 140 && value <= 180) return { status: 'Elevated', color: 'text-orange-600' };
      return { status: 'High', color: 'text-red-600' };
    };

    return NextResponse.json({
      data: chartData,
      stats,
      statusInfo: getGlucoseStatus(stats.average),
    });
  } catch (error) {
    console.error('Error fetching blood glucose data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch blood glucose data' },
      { status: 500 }
    );
  }
}
