import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import StepsGenerator from '@/generators/stepsGenerator';

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

    // Calculate date range based on period
    const now = new Date();
    let startDate = new Date(now);
    let endDate = new Date(now);
    endDate.setHours(23, 59, 59, 999);

    switch (period) {
      case 'week':
        // Get the start of this week (Monday)
        const day = startDate.getDay();
        const diff = startDate.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
        startDate.setDate(diff);
        startDate.setHours(0, 0, 0, 0);
        // End date is Sunday of the same week
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'month':
        // Get the first day of this month
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
        // End date is last day of this month
        endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0, 23, 59, 59, 999);
        break;
      case 'year':
        // Get the data for the current year (January 1st to December 31st)
        startDate.setFullYear(startDate.getFullYear(), 0, 1);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate.getFullYear(), 11, 31, 23, 59, 59, 999);
        break;
      case 'today':
      default:
        if (dateParam) {
          // Parse date string to create local midnight (not UTC)
          const [year, month, day] = dateParam.split('-').map(Number);
          startDate = new Date(year, month - 1, day, 0, 0, 0, 0);
          endDate = new Date(year, month - 1, day, 23, 59, 59, 999);
        } else {
          // Default to today
          startDate.setHours(0, 0, 0, 0);
        }
        break;
    }

    // Fetch steps data for the date range
    const stepsData = await prisma.biometric_data.findMany({
      where: {
        patient_id: patientId,
        metric_type: 'steps',
        timestamp: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: {
        timestamp: 'asc'
      }
    });

    if (!stepsData || stepsData.length === 0) {
      return new Response(
        JSON.stringify({ 
          data: [],
          message: 'No steps data available',
          stats: null
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Determine aggregation interval based on period
    let aggregationIntervalMs;
    let timeFormatKey;

    if (period === 'year') {
      // Monthly aggregation for year view
      timeFormatKey = 'month';
    } else {
      // Daily aggregation for week/month views
      aggregationIntervalMs = 24 * 60 * 60 * 1000;
      timeFormatKey = 'day';
    }

    // Aggregate data into buckets or use raw data
    let chartData;
    
    if (period === 'today') {
      // For single day, sum steps by hour (each reading is a 5-minute interval with individual step count)
      const hourlySteps = {};
      
      for (const reading of stepsData) {
        const time = new Date(reading.timestamp);
        const hour = time.getHours();
        hourlySteps[hour] = (hourlySteps[hour] || 0) + Number(reading.value);
      }
      
      // Create chart data with hourly totals
      chartData = [];
      for (let hour = 0; hour < 24; hour++) {
        const steps = hourlySteps[hour] || 0;
        const ampm = hour >= 12 ? 'pm' : 'am';
        const displayHour = hour % 12 === 0 ? 12 : hour % 12;
        const nextHour = (hour + 1) % 24;
        const nextAmpm = nextHour >= 12 ? 'pm' : 'am';
        const displayNextHour = nextHour % 12 === 0 ? 12 : nextHour % 12;
        const timeLabel = `${displayHour}${ampm}-${displayNextHour}${nextAmpm}`;
        
        chartData.push({
          hour,
          timestamp: timeLabel,
          value: Math.round(steps),
          rawTime: hour,
          date: new Date(stepsData[0].timestamp).toLocaleDateString()
        });
      }
    } else if (period === 'year') {
      // For year period, aggregate by month with average steps per day
      const monthlyData = new Map();
      
      // Initialize all 12 months
      const currentDate = new Date(startDate);
      for (let i = 0; i < 12; i++) {
        const monthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
        monthlyData.set(monthKey, {
          totalSteps: 0,
          days: new Set(),
          monthDate: new Date(currentDate)
        });
        currentDate.setMonth(currentDate.getMonth() + 1);
      }
      
      // Aggregate steps by month
      stepsData.forEach((item) => {
        const timestamp = new Date(item.timestamp);
        const monthKey = `${timestamp.getFullYear()}-${String(timestamp.getMonth() + 1).padStart(2, '0')}`;
        const dayKey = `${timestamp.getFullYear()}-${String(timestamp.getMonth() + 1).padStart(2, '0')}-${String(timestamp.getDate()).padStart(2, '0')}`;
        
        if (monthlyData.has(monthKey)) {
          const monthData = monthlyData.get(monthKey);
          monthData.totalSteps += Number(item.value);
          monthData.days.add(dayKey);
        }
      });
      
      // Create chart data from monthly aggregates
      chartData = [];
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      monthlyData.forEach((data, monthKey) => {
        const [year, month] = monthKey.split('-');
        const monthIndex = parseInt(month) - 1;
        const monthName = monthNames[monthIndex];
        const daysCount = data.days.size;
        const avgStepsPerDay = daysCount > 0 ? Math.round(data.totalSteps / daysCount) : 0;
        
        chartData.push({
          timestamp: monthName,
          value: avgStepsPerDay,
          totalSteps: data.totalSteps,
          daysWithData: daysCount,
          rawTime: data.monthDate
        });
      });
    } else {
      // For week/month periods, aggregate by day
      const buckets = new Map();

      stepsData.forEach((item) => {
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
        const value = Number(item.value);
        bucket.sum += value;
        bucket.count += 1;
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
            // Show date for week/month views (just MM-DD format)
            displayTimestamp = bucket.timestamp.toLocaleDateString([], {
              month: '2-digit',
              day: '2-digit'
            });
          }

          return {
            timestamp: displayTimestamp,
            value: Math.round(bucket.sum),
            hasData: true,
            rawTime: bucket.timestamp
          };
        });
      
      // Fill in missing dates for week and month periods
      if ((period === 'week' || period === 'month') && chartData.length > 0) {
        const allDays = [];
        const currentDate = new Date(startDate);
        
        while (currentDate <= endDate) {
          const dateStr = currentDate.toLocaleDateString([], {
            month: '2-digit',
            day: '2-digit'
          });
          
          const existingData = chartData.find(item => item.timestamp === dateStr);
          
          if (existingData) {
            allDays.push(existingData);
          } else {
            // Add empty day
            allDays.push({
              timestamp: dateStr,
              value: 0,
              hasData: false,
              rawTime: new Date(currentDate)
            });
          }
          
          currentDate.setDate(currentDate.getDate() + 1);
        }
        
        chartData = allDays;
      }
    }

    // Calculate statistics based on the fetched data
    let statsToReturn;
    
    const totalSteps = stepsData.reduce((sum, item) => sum + Number(item.value), 0);
    const readings = stepsData.length;
    
    if (period === 'today') {
      // For single day, calculate stats from hourly data
      const hourlyValues = chartData.map(d => d.value);
      const maxHourly = Math.max(...hourlyValues);
      const avgHourly = (totalSteps / 24).toFixed(0);
      
      statsToReturn = {
        total: totalSteps,
        average: Number(avgHourly),
        max: maxHourly,
        min: Math.min(...hourlyValues.filter(v => v > 0)) || 0,
        goalAchieved: totalSteps >= 10000,
        goal: 10000
      };
    } else if (period === 'year') {
      // For year period, calculate stats based on monthly averages
      const monthlyValues = chartData.map(d => d.value);
      const maxMonthly = Math.max(...monthlyValues);
      const avgMonthly = (monthlyValues.reduce((a, b) => a + b, 0) / monthlyValues.length).toFixed(0);
      
      statsToReturn = {
        total: totalSteps,
        average: Number(avgMonthly),
        max: maxMonthly,
        min: Math.min(...monthlyValues.filter(v => v > 0)) || 0,
        monthsWithData: monthlyValues.filter(v => v > 0).length,
        totalMonths: monthlyValues.length
      };
    } else {
      // For week/month periods, calculate stats from daily aggregates
      const dailyValues = chartData.map(d => d.value);
      const avgDaily = (totalSteps / (dailyValues.length || 1)).toFixed(0);
      const maxDaily = Math.max(...dailyValues);
      
      statsToReturn = {
        total: totalSteps,
        average: Number(avgDaily),
        max: maxDaily,
        min: Math.min(...dailyValues.filter(v => v > 0)) || 0,
        daysWithData: dailyValues.filter(v => v > 0).length,
        totalDays: dailyValues.length
      };
    }

    return new Response(
      JSON.stringify({
        data: chartData,
        stats: statsToReturn,
        period
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

/**
 * DELETE /api/biometrics/steps?date=YYYY-MM-DD
 * Delete all step data for a specific date
 */
export async function DELETE(request) {
  try {
    // Authenticate user
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

    const patientId = session.userId;

    // Get date from query parameters
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');

    if (!dateParam) {
      return NextResponse.json(
        { error: 'Date parameter is required (format: YYYY-MM-DD)' },
        { status: 400 }
      );
    }

    // Parse and normalize date
    const targetDate = new Date(dateParam);
    if (isNaN(targetDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format. Use YYYY-MM-DD' },
        { status: 400 }
      );
    }

    targetDate.setHours(0, 0, 0, 0);
    const dayEnd = new Date(targetDate);
    dayEnd.setHours(23, 59, 59, 999);

    // Delete all steps data for this date
    const deletedResult = await prisma.biometric_data.deleteMany({
      where: {
        patient_id: patientId,
        metric_type: 'steps',
        timestamp: {
          gte: targetDate,
          lte: dayEnd
        }
      }
    });

    return NextResponse.json(
      {
        success: true,
        message: `Deleted ${deletedResult.count} step records`,
        count: deletedResult.count,
        date: dateParam
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting steps data:', error);
    return NextResponse.json(
      { error: 'Failed to delete steps data' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/biometrics/steps
 * Generate step data for a specific date
 */
export async function POST(request) {
  try {
    // Authenticate user
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

    const patientId = session.userId;

    // Parse request body for date
    let date = new Date();
    try {
      const body = await request.json();
      if (body.date) {
        const parsedDate = new Date(body.date);
        if (!isNaN(parsedDate.getTime())) {
          date = parsedDate;
        }
      }
    } catch (e) {
      // Request body is optional, use default date
    }

    // Normalize date to midnight
    date.setHours(0, 0, 0, 0);

    // Verify patient exists
    const patient = await prisma.patients.findUnique({
      where: { id: patientId }
    });

    if (!patient) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      );
    }

    // Generate steps data
    const generator = new StepsGenerator();
    const stepsData = generator.generate(date);

    // Add patient_id and prepare for database
    const dataWithPatientId = stepsData.map(point => ({
      ...point,
      patient_id: patientId
    }));

    // Save to database
    const result = await prisma.biometric_data.createMany({
      data: dataWithPatientId,
      skipDuplicates: false
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Step data generated successfully',
        date: date.toISOString().split('T')[0],
        dataPointsGenerated: result.count,
        data: stepsData
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error generating steps data:', error);
    return NextResponse.json(
      { error: 'Failed to generate steps data', details: error.message },
      { status: 500 }
    );
  }
}
