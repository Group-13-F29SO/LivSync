import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import CaloriesGenerator from '@/generators/caloriesGenerator';

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
    const dateParam = url.searchParams.get('date');

    // Calculate date range based on period
    const now = new Date();
    let startDate = new Date(now);
    let endDate = new Date(now);
    endDate.setHours(23, 59, 59, 999);

    switch (period) {
      case 'week':
        const day = startDate.getDay();
        const diff = startDate.getDate() - day + (day === 0 ? -6 : 1);
        startDate.setDate(diff);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'month':
        startDate.setDate(1);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0, 23, 59, 59, 999);
        break;
      case 'year':
        startDate.setFullYear(startDate.getFullYear(), 0, 1);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate.getFullYear(), 11, 31, 23, 59, 59, 999);
        break;
      case 'today':
      default:
        if (dateParam) {
          const [year, month, dayOfMonth] = dateParam.split('-').map(Number);
          startDate = new Date(year, month - 1, dayOfMonth, 0, 0, 0, 0);
          endDate = new Date(year, month - 1, dayOfMonth, 23, 59, 59, 999);
        } else {
          startDate.setHours(0, 0, 0, 0);
        }
        break;
    }

    // Fetch calories data for the date range
    const caloriesData = await prisma.biometric_data.findMany({
      where: {
        patient_id: patientId,
        metric_type: 'calories',
        timestamp: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: {
        timestamp: 'asc'
      }
    });

    if (!caloriesData || caloriesData.length === 0) {
      return new Response(
        JSON.stringify({ 
          data: [],
          message: 'No calories data available',
          stats: null
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    let chartData;
    
    if (period === 'today') {
      // For single day, sum calories by hour
      const hourlyCalories = {};
      
      for (const reading of caloriesData) {
        const time = new Date(reading.timestamp);
        const hour = time.getHours();
        hourlyCalories[hour] = (hourlyCalories[hour] || 0) + Number(reading.value);
      }
      
      // Create chart data with hourly totals
      chartData = [];
      for (let hour = 0; hour < 24; hour++) {
        const calories = hourlyCalories[hour] || 0;
        const ampm = hour >= 12 ? 'pm' : 'am';
        const displayHour = hour % 12 === 0 ? 12 : hour % 12;
        const nextHour = (hour + 1) % 24;
        const nextAmpm = nextHour >= 12 ? 'pm' : 'am';
        const displayNextHour = nextHour % 12 === 0 ? 12 : nextHour % 12;
        const timeLabel = `${displayHour}${ampm}-${displayNextHour}${nextAmpm}`;
        
        chartData.push({
          hour,
          timestamp: timeLabel,
          value: Math.round(calories),
          rawTime: hour,
          date: new Date(caloriesData[0].timestamp).toLocaleDateString()
        });
      }
    } else if (period === 'year') {
      // For year period, aggregate by month with average calories per day
      const monthlyData = new Map();
      
      const currentDate = new Date(startDate);
      for (let i = 0; i < 12; i++) {
        const monthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
        monthlyData.set(monthKey, {
          totalCalories: 0,
          days: new Set(),
          monthDate: new Date(currentDate)
        });
        currentDate.setMonth(currentDate.getMonth() + 1);
      }
      
      caloriesData.forEach((item) => {
        const timestamp = new Date(item.timestamp);
        const monthKey = `${timestamp.getFullYear()}-${String(timestamp.getMonth() + 1).padStart(2, '0')}`;
        const dayKey = `${timestamp.getFullYear()}-${String(timestamp.getMonth() + 1).padStart(2, '0')}-${String(timestamp.getDate()).padStart(2, '0')}`;
        
        if (monthlyData.has(monthKey)) {
          const monthData = monthlyData.get(monthKey);
          monthData.totalCalories += Number(item.value);
          monthData.days.add(dayKey);
        }
      });
      
      chartData = [];
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      monthlyData.forEach((data, monthKey) => {
        const [year, month] = monthKey.split('-');
        const monthIndex = parseInt(month) - 1;
        const monthName = monthNames[monthIndex];
        const daysCount = data.days.size;
        const avgCaloriesPerDay = daysCount > 0 ? Math.round(data.totalCalories / daysCount) : 0;
        
        chartData.push({
          timestamp: monthName,
          value: avgCaloriesPerDay,
          totalCalories: data.totalCalories,
          daysWithData: daysCount,
          rawTime: data.monthDate
        });
      });
    } else {
      // For week/month periods, aggregate by day
      const aggregationIntervalMs = 24 * 60 * 60 * 1000;
      const buckets = new Map();

      caloriesData.forEach((item) => {
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

      chartData = [...buckets.entries()]
        .sort((a, b) => a[0] - b[0])
        .map(([, bucket]) => {
          const displayTimestamp = bucket.timestamp.toLocaleDateString([], {
            month: '2-digit',
            day: '2-digit'
          });

          return {
            timestamp: displayTimestamp,
            value: Math.round(bucket.sum),
            hasData: true,
            rawTime: bucket.timestamp
          };
        });
      
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

    // Fetch the user's calories goal
    const caloriesGoal = await prisma.goals.findFirst({
      where: {
        patient_id: patientId,
        metric_type: 'calories'
      },
      select: {
        target_value: true
      }
    });

    const goalValue = caloriesGoal?.target_value || 2200; // Default to 2200 if no goal set

    // Calculate statistics
    let statsToReturn;
    
    const totalCalories = caloriesData.reduce((sum, item) => sum + Number(item.value), 0);
    
    if (period === 'today') {
      const hourlyValues = chartData.map(d => d.value);
      const maxHourly = Math.max(...hourlyValues);
      const avgHourly = (totalCalories / 24).toFixed(0);
      
      statsToReturn = {
        total: totalCalories,
        average: Number(avgHourly),
        max: maxHourly,
        min: Math.min(...hourlyValues.filter(v => v > 0)) || 0,
        latest: hourlyValues[new Date().getHours()] || 0,
        goalAchieved: totalCalories >= goalValue,
        goal: goalValue
      };
    } else if (period === 'year') {
      const monthlyValues = chartData.map(d => d.value);
      const maxMonthly = Math.max(...monthlyValues);
      const avgMonthly = (monthlyValues.reduce((a, b) => a + b, 0) / monthlyValues.length).toFixed(0);
      
      statsToReturn = {
        total: totalCalories,
        average: Number(avgMonthly),
        max: maxMonthly,
        min: Math.min(...monthlyValues.filter(v => v > 0)) || 0,
        monthsWithData: monthlyValues.filter(v => v > 0).length,
        totalMonths: monthlyValues.length,
        goal: goalValue
      };
    } else {
      const dailyValues = chartData.map(d => d.value);
      const avgDaily = (totalCalories / (dailyValues.length || 1)).toFixed(0);
      const maxDaily = Math.max(...dailyValues);
      
      statsToReturn = {
        total: totalCalories,
        average: Number(avgDaily),
        max: maxDaily,
        min: Math.min(...dailyValues.filter(v => v > 0)) || 0,
        latest: dailyValues[dailyValues.length - 1] || 0,
        daysWithData: dailyValues.filter(v => v > 0).length,
        totalDays: dailyValues.length,
        goal: goalValue
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
    console.error('Error fetching calories data:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to fetch calories data' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * DELETE /api/biometrics/calories?date=YYYY-MM-DD
 * Delete all calories data for a specific date
 */
export async function DELETE(request) {
  try {
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

    // Delete all calories data for this date
    const deletedResult = await prisma.biometric_data.deleteMany({
      where: {
        patient_id: patientId,
        metric_type: 'calories',
        timestamp: {
          gte: targetDate,
          lte: dayEnd
        }
      }
    });

    return NextResponse.json(
      {
        success: true,
        message: `Deleted ${deletedResult.count} calorie records`,
        count: deletedResult.count,
        date: dateParam
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting calories data:', error);
    return NextResponse.json(
      { error: 'Failed to delete calories data' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/biometrics/calories
 * Generate calories data for a specific date
 */
export async function POST(request) {
  try {
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

    // Get date from request body
    const body = await request.json();
    let date = body.date ? new Date(body.date) : new Date();
    
    if (isNaN(date.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      );
    }

    // Normalize date to start of day
    date.setHours(0, 0, 0, 0);

    // Check if patient exists
    const patient = await prisma.patients.findUnique({
      where: { id: patientId }
    });

    if (!patient) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      );
    }

    // Delete existing data for this date
    await prisma.biometric_data.deleteMany({
      where: {
        patient_id: patientId,
        metric_type: 'calories',
        timestamp: {
          gte: date,
          lte: new Date(date.getTime() + 24 * 60 * 60 * 1000 - 1)
        }
      }
    });

    // Generate calories data
    const generator = new CaloriesGenerator();
    const caloriesData = generator.generate(date);

    // Add patient_id and prepare for database
    const dataWithPatientId = caloriesData.map(point => ({
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
        message: 'Calories data generated successfully',
        date: date.toISOString().split('T')[0],
        dataPointsGenerated: result.count,
        data: caloriesData
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error generating calories data:', error);
    return NextResponse.json(
      { error: 'Failed to generate calories data', details: error.message },
      { status: 500 }
    );
  }
}
