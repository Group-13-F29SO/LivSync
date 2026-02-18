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
      case '7days':
        startDate.setDate(startDate.getDate() - 6); // Include today + 6 previous days
        startDate.setHours(0, 0, 0, 0);
        break;
      case '30days':
        startDate.setDate(startDate.getDate() - 29);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'all':
        if (startDateParam && endDateParam) {
          // User provided a custom date range
          // Parse date strings to create local midnight (not UTC)
          const [startYear, startMonth, startDay] = startDateParam.split('-').map(Number);
          const [endYear, endMonth, endDay] = endDateParam.split('-').map(Number);
          startDate = new Date(startYear, startMonth - 1, startDay, 0, 0, 0, 0);
          endDate = new Date(endYear, endMonth - 1, endDay, 23, 59, 59, 999);
        } else {
          // Default: fetch from epoch if no range specified
          startDate = new Date(0);
        }
        break;
      case 'today':
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

    // For "all" period without custom date range, adjust startDate to first data point instead of epoch
    if (period === 'all' && !startDateParam && heartRateData.length > 0) {
      const firstDataPoint = new Date(heartRateData[0].timestamp);
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
      chartData = heartRateData
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
            rawTime: timestamp
          };
        });
    } else {
      // For multi-day periods, use bucketed aggregation
      const buckets = new Map();

      heartRateData.forEach((item) => {
        const timestamp = new Date(item.timestamp);
        const bucketIndex = Math.floor((timestamp.getTime() - startDate.getTime()) / aggregationIntervalMs);

        if (!buckets.has(bucketIndex)) {
          buckets.set(bucketIndex, {
            sum: 0,
            count: 0,
            min: Infinity,
            max: -Infinity,
            timestamp
          });
        }

        const bucket = buckets.get(bucketIndex);
        const value = Number(item.value);
        bucket.sum += value;
        bucket.count += 1;
        bucket.min = Math.min(bucket.min, value);
        bucket.max = Math.max(bucket.max, value);
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
            rawTime: bucket.timestamp
          };
        });
    }

    // For range bar view, fill in missing dates (7days and all periods)
    if (useRangeBar && (period === '7days' || period === 'all')) {
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
    let statsToReturn;
    
    if (period === 'today' && heartRateData.length > 0) {
      // For single day, calculate stats directly from the raw data for that day
      // This ensures accurate min/max/average regardless of bucketing
      const rawValues = heartRateData.map(item => Number(item.value));
      const minVal = Math.min(...rawValues);
      const maxVal = Math.max(...rawValues);
      const avgVal = (rawValues.reduce((a, b) => a + b, 0) / rawValues.length).toFixed(1);
      
      statsToReturn = {
        average: Number(avgVal),
        max: maxVal,
        min: minVal,
        count: rawValues.length
      };
    } else {
      // For multi-day periods, calculate stats from raw data
      const rawValues = heartRateData.map(item => Number(item.value));
      const averageRaw = (rawValues.reduce((a, b) => a + b, 0) / rawValues.length).toFixed(1);
      const maxRaw = Math.max(...rawValues);
      const minRaw = Math.min(...rawValues);
      const count = heartRateData.length; // Total raw readings
      
      statsToReturn = {
        average: Number(averageRaw),
        max: maxRaw,
        min: minRaw,
        count: count
      };
    }

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
