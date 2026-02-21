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
    const startDateParam = url.searchParams.get('startDate'); // For 'week' period, start of date range
    const endDateParam = url.searchParams.get('endDate'); // For 'week' period, end of date range

    // Calculate date range based on period
    const now = new Date();
    let startDate = new Date(now);
    let endDate = new Date(now);
    endDate.setHours(23, 59, 59, 999);

    switch (period) {
      case 'week':
        // Get Monday of the current week
        const dayOfWeek = now.getDay();
        const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Sunday=6 days back, Monday=0 days back
        startDate.setDate(startDate.getDate() - daysToMonday);
        startDate.setHours(0, 0, 0, 0);
        // Set endDate to Sunday of the same week
        endDate.setDate(endDate.getDate() + (6 - daysToMonday));
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'month':
        // Get the first day of the current month
        startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
        // Get the last day of the current month
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
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

    // Fetch blood glucose data for the date range
    const bloodGlucoseData = await prisma.biometric_data.findMany({
      where: {
        patient_id: patientId,
        metric_type: 'blood_glucose',
        timestamp: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: {
        timestamp: 'asc'
      }
    });

    if (!bloodGlucoseData || bloodGlucoseData.length === 0) {
      return new Response(
        JSON.stringify({ 
          data: [],
          message: 'No blood glucose data available',
          stats: null
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Determine aggregation based on period
    let chartData;
    
    if (period === 'today') {
      // For single day, display raw data points
      chartData = bloodGlucoseData
        .map((item) => {
          const timestamp = new Date(item.timestamp);
          const displayTimestamp = timestamp.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
          });
          
          return {
            timestamp: displayTimestamp,
            value: Number(item.value),
            rawTime: timestamp
          };
        });
    } else {
      // For multi-day periods (week, month), aggregate by day showing average
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
            timestamp
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
          if (period === 'month') {
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
              value: Math.round((bucket.sum / bucket.count) * 10) / 10, // Average rounded to 1 decimal
              min: bucket.min,
              max: bucket.max,
              count: bucket.count,
              rawDate: dateKey,
              hasData: true
            };
          } else {
            return {
              timestamp: displayTimestamp,
              value: null,
              min: null,
              max: null,
              count: 0,
              rawDate: dateKey,
              hasData: false
            };
          }
        });
    }

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
