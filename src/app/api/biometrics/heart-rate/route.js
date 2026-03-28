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
    const dateParam = url.searchParams.get('date'); // For 'today' period, allows selecting a specific day
    const startDateParam = url.searchParams.get('startDate'); // For 'all' period, start of date range
    const endDateParam = url.searchParams.get('endDate'); // For 'all' period, end of date range

    // Calculate date range based on period
    const now = new Date();
    let startDate = new Date(now);
    let endDate = new Date(now);
    endDate.setHours(23, 59, 59, 999);

    switch (period) {
      case 'thisWeek':
        // Get Monday of current week
        const dayOfWeek = startDate.getDay();
        const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Sunday is 0
        startDate.setDate(startDate.getDate() - daysToMonday);
        startDate.setHours(0, 0, 0, 0);
        // Set end date to Sunday of current week
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'thisMonth':
        // Get first day of current month
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
        // Set end date to last day of current month
        endDate.setMonth(endDate.getMonth() + 1);
        endDate.setDate(0);
        endDate.setHours(23, 59, 59, 999);
        break;
case 'all':
  if (startDateParam && endDateParam) {
    const parsedStart = new Date(startDateParam);
    const parsedEnd = new Date(endDateParam);

    if (isNaN(parsedStart.getTime()) || isNaN(parsedEnd.getTime())) {
      return new Response(
        JSON.stringify({ error: 'Invalid date range' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    startDate = new Date(parsedStart);
    startDate.setHours(0, 0, 0, 0);

    endDate = new Date(parsedEnd);
    endDate.setHours(23, 59, 59, 999);
  } else {
    startDate = new Date(0);
  }
  break;      case 'today':
      default:
        if (dateParam) {
          // Parse date string to create local midnight (not UTC)
          // dateParam format: "YYYY-MM-DD"
          const [year, month, day] = dateParam.split('-').map(Number);
          startDate = new Date(year, month - 1, day, 0, 0, 0, 0);
          endDate = new Date(year, month - 1, day, 23, 59, 59, 999);
        } else {
          // Default to today
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

    // Deduplicate by timestamp: prioritize manual entries (is_user_entered=true)
    const dataByTimestamp = new Map();
    heartRateData.forEach((item) => {
      const tsKey = item.timestamp.toISOString();
      const existing = dataByTimestamp.get(tsKey);
      
      // If no existing entry or current entry is manual and existing isn't, use current
      if (!existing || (item.is_user_entered && !existing.is_user_entered)) {
        dataByTimestamp.set(tsKey, item);
      }
    });

    // Convert back to array and sort
    const deduplicatedData = Array.from(dataByTimestamp.values())
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    // For "all" period without custom date range, adjust startDate to first data point instead of epoch
    if (period === 'all' && !startDateParam && deduplicatedData.length > 0) {
      const firstDataPoint = new Date(deduplicatedData[0].timestamp);
      startDate = new Date(firstDataPoint);
      startDate.setHours(0, 0, 0, 0);
    }

    // Determine aggregation interval based on date range
    const daysDiff = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
    let aggregationIntervalMs;
    let timeFormatKey;
    let chartType = 'area'; // Default to area chart
    let useRangeBar = false; // Flag for special range bar rendering

    if (daysDiff > 30) {
      // Multi-week/All data: aggregate by day, use line chart with min/avg/max
      aggregationIntervalMs = 24 * 60 * 60 * 1000;
      timeFormatKey = 'day';
      chartType = 'rangeBar';
      useRangeBar = true;
    } else if (daysDiff > 1) {
      // Multi-day (7 days): aggregate by full calendar day, use line chart with min/avg/max
      aggregationIntervalMs = 24 * 60 * 60 * 1000;
      timeFormatKey = 'day';
      chartType = 'rangeBar';
      useRangeBar = true;
    } else {
      // Single day: display raw data points without bucketing to show exact database values
      const MAX_CHART_POINTS = 100;
      aggregationIntervalMs = 0; // No bucketing for single day
      timeFormatKey = 'time';
      chartType = 'area';
    }

    // Aggregate data into buckets or use raw data
    let chartData;
    
    if (period === 'today') {
      // For single day, use raw data points without aggregation
      chartData = deduplicatedData
        .map((item) => {
          const timestamp = new Date(item.timestamp);
          const displayTimestamp = timestamp.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
          });
          
          return {
            timestamp: displayTimestamp,
            average: Number(item.value),
            max: Number(item.value),
            min: Number(item.value),
            hasData: true,
            rawTime: timestamp,
            is_user_entered: item.is_user_entered,
            source: item.is_user_entered ? 'manual' : item.source
          };
        });
    } else {
      // For multi-day periods, use bucketed aggregation
      const buckets = new Map();

      deduplicatedData.forEach((item) => {
        const timestamp = new Date(item.timestamp);
        const bucketIndex = Math.floor((timestamp.getTime() - startDate.getTime()) / aggregationIntervalMs);

        if (!buckets.has(bucketIndex)) {
          buckets.set(bucketIndex, {
            sum: 0,
            count: 0,
            min: Infinity,
            max: -Infinity,
            timestamp,
            has_manual: false
          });
        }

        const bucket = buckets.get(bucketIndex);
        const value = Number(item.value);
        bucket.sum += value;
        bucket.count += 1;
        bucket.min = Math.min(bucket.min, value);
        bucket.max = Math.max(bucket.max, value);
        if (item.is_user_entered) {
          bucket.has_manual = true;
        }
        if (timestamp < bucket.timestamp) {
          bucket.timestamp = timestamp;
        }
      });

      // Format chart data from buckets
      chartData = [...buckets.entries()]
        .sort((a, b) => a[0] - b[0])
        .map(([, bucket]) => {
          let displayTimestamp;

          if (timeFormatKey === 'day') {
            // Show date for multi-day views
            if (period === 'all') {
              // Include year for "all" data spanning multiple years
              displayTimestamp = bucket.timestamp.toLocaleDateString([], {
                year: '2-digit',
                month: '2-digit',
                day: '2-digit'
              });
            } else {
              // Just month/day for 7day and 30day views
              displayTimestamp = bucket.timestamp.toLocaleDateString([], {
                month: '2-digit',
                day: '2-digit'
              });
            }
          } else {
            // Show time for single/few-day views
            displayTimestamp = bucket.timestamp.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit'
            });
          }

          const average = Number((bucket.sum / bucket.count).toFixed(1));

          return {
            timestamp: displayTimestamp,
            average,
            max: bucket.max,
            min: bucket.min,
            hasData: true,
            rawTime: bucket.timestamp,
            has_manual_entry: bucket.has_manual
          };
        });
    }

    // For range bar view, fill in missing dates (thisWeek, thisMonth and all periods)
    if (useRangeBar && (period === 'thisWeek' || period === 'thisMonth' || period === 'all')) {
      const allDays = [];
      const currentDate = new Date(startDate);
      
      while (currentDate <= endDate) {
        let dateStr;
        if (period === 'all') {
          dateStr = currentDate.toLocaleDateString([], {
            year: '2-digit',
            month: '2-digit',
            day: '2-digit'
          });
        } else {
          dateStr = currentDate.toLocaleDateString([], {
            month: '2-digit',
            day: '2-digit'
          });
        }
        
        const existingData = chartData.find(item => item.timestamp === dateStr);
        
        if (existingData) {
          allDays.push(existingData);
        } else {
          // Add empty day
          allDays.push({
            timestamp: dateStr,
            average: null,
            max: null,
            min: null,
            hasData: false,
            rawTime: new Date(currentDate)
          });
        }
        
        currentDate.setDate(currentDate.getDate() + 1);
      }
      
      chartData = allDays;
    }

    // Calculate statistics based on the chart data that will be displayed
        let sum = 0;
        let minVal = Infinity;
        let maxVal = -Infinity;
        let count = 0;

        for (const item of heartRateData) {
          const value = Number(item.value);
          if (!Number.isFinite(value)) continue;

          sum += value;
          count += 1;
          if (value < minVal) minVal = value;
          if (value > maxVal) maxVal = value;
        }

        const statsToReturn = {
          average: count > 0 ? Number((sum / count).toFixed(1)) : 0,
          max: count > 0 ? maxVal : 0,
          min: count > 0 ? minVal : 0,
          count,
        };
    // Get earliest and latest dates for available data
const earliestDateRow = await prisma.biometric_data.findFirst({
  where: {
    patient_id: patientId,
    metric_type: 'heart_rate'
  },
  select: { timestamp: true },
  orderBy: { timestamp: 'asc' }
});

const latestDateRow = await prisma.biometric_data.findFirst({
  where: {
    patient_id: patientId,
    metric_type: 'heart_rate'
  },
  select: { timestamp: true },
  orderBy: { timestamp: 'desc' }
});

const availableDates = {
  earliest: earliestDateRow ? new Date(earliestDateRow.timestamp) : null,
  latest: latestDateRow ? new Date(latestDateRow.timestamp) : null
};


    return new Response(
      JSON.stringify({
        data: chartData,
        stats: statsToReturn,
        period,
        chartType,
        useRangeBar,
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