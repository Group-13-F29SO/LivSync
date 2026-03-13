import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import StepsGenerator from '@/generators/stepsGenerator';

function getSession() {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get('livsync_session');

  if (!sessionCookie) return null;

  try {
    return JSON.parse(sessionCookie.value);
  } catch {
    return null;
  }
}

function formatLocalDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function startOfLocalDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfLocalDay(date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

export async function GET(req) {
  try {
    const session = getSession();

    if (!session || !session.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const patientId = session.userId;

    const url = new URL(req.url);
    const period = url.searchParams.get('period') || 'today';
    const dateParam = url.searchParams.get('date');

    let startDate;
    let endDate;
    let selectedDate = dateParam;

    // For "today", if no explicit date is provided, use latest available steps record date
    if (period === 'today' && !dateParam) {
      const latestStep = await prisma.biometric_data.findFirst({
        where: {
          patient_id: patientId,
          metric_type: 'steps',
        },
        orderBy: { timestamp: 'desc' },
        select: { timestamp: true },
      });

      if (latestStep) {
        const latestDate = new Date(latestStep.timestamp);
        selectedDate = formatLocalDate(latestDate);
      } else {
        selectedDate = formatLocalDate(new Date());
      }
    }

    const now = new Date();

    switch (period) {
      case 'week': {
        startDate = new Date(now);
        const day = startDate.getDay();
        const diff = startDate.getDate() - day + (day === 0 ? -6 : 1);
        startDate.setDate(diff);
        startDate.setHours(0, 0, 0, 0);

        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
        break;
      }

      case 'month': {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        break;
      }

      case 'year': {
        startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
        endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
        break;
      }

      case 'today':
      default: {
        const [year, month, day] = selectedDate.split('-').map(Number);
        startDate = new Date(year, month - 1, day, 0, 0, 0, 0);
        endDate = new Date(year, month - 1, day, 23, 59, 59, 999);
        break;
      }
    }

    const stepsData = await prisma.biometric_data.findMany({
      where: {
        patient_id: patientId,
        metric_type: 'steps',
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        timestamp: 'asc',
      },
    });

    if (!stepsData || stepsData.length === 0) {
      return NextResponse.json({
        data: [],
        message: 'No steps data available',
        stats: null,
        selectedDate,
        period,
      });
    }

    let chartData;

    if (period === 'today') {
      const hourlySteps = {};

      for (const reading of stepsData) {
        const time = new Date(reading.timestamp);
        const hour = time.getHours();
        hourlySteps[hour] = (hourlySteps[hour] || 0) + Number(reading.value);
      }

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
          date: selectedDate,
        });
      }
    } else if (period === 'year') {
      const monthlyData = new Map();
      const currentDate = new Date(startDate);

      for (let i = 0; i < 12; i++) {
        const monthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
        monthlyData.set(monthKey, {
          totalSteps: 0,
          days: new Set(),
          monthDate: new Date(currentDate),
        });
        currentDate.setMonth(currentDate.getMonth() + 1);
      }

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

      chartData = [];
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

      monthlyData.forEach((data, monthKey) => {
        const [, month] = monthKey.split('-');
        const monthIndex = parseInt(month) - 1;
        const monthName = monthNames[monthIndex];
        const daysCount = data.days.size;
        const avgStepsPerDay = daysCount > 0 ? Math.round(data.totalSteps / daysCount) : 0;

        chartData.push({
          timestamp: monthName,
          value: avgStepsPerDay,
          totalSteps: data.totalSteps,
          daysWithData: daysCount,
          rawTime: data.monthDate,
        });
      });
    } else {
      const dailyMap = new Map();

      stepsData.forEach((item) => {
        const timestamp = new Date(item.timestamp);
        const dateKey = formatLocalDate(timestamp);

        if (!dailyMap.has(dateKey)) {
          dailyMap.set(dateKey, {
            value: 0,
            rawTime: new Date(timestamp),
          });
        }

        dailyMap.get(dateKey).value += Number(item.value);
      });

      chartData = [];
      const currentDate = new Date(startDate);

      while (currentDate <= endDate) {
        const dateKey = formatLocalDate(currentDate);
        const displayTimestamp = currentDate.toLocaleDateString([], {
          month: '2-digit',
          day: '2-digit',
        });

        const existing = dailyMap.get(dateKey);

        chartData.push({
          timestamp: displayTimestamp,
          value: existing ? Math.round(existing.value) : 0,
          hasData: !!existing,
          rawTime: new Date(currentDate),
        });

        currentDate.setDate(currentDate.getDate() + 1);
      }
    }

    const totalSteps = stepsData.reduce((sum, item) => sum + Number(item.value), 0);

    // Fetch user's goal for this metric
    let goal = null;
    if (period === 'today') {
      const userGoal = await prisma.goals.findFirst({
        where: {
          patient_id: patientId,
          metric_type: 'steps',
        },
        select: { target_value: true },
      });
      goal = userGoal?.target_value || null;
    }

    let statsToReturn;

    if (period === 'today') {
      const hourlyValues = chartData.map((d) => d.value);
      const maxHourly = Math.max(...hourlyValues);
      const avgHourly = Math.round(totalSteps / 24);

      statsToReturn = {
        total: totalSteps,
        average: avgHourly,
        max: maxHourly,
        min: Math.min(...hourlyValues.filter((v) => v > 0)) || 0,
        goalAchieved: goal ? totalSteps >= goal : false,
        goal: goal,
      };
    } else if (period === 'year') {
      const monthlyValues = chartData.map((d) => d.value);
      const maxMonthly = Math.max(...monthlyValues);
      const avgMonthly = Math.round(
        monthlyValues.reduce((a, b) => a + b, 0) / (monthlyValues.length || 1)
      );

      statsToReturn = {
        total: totalSteps,
        average: avgMonthly,
        max: maxMonthly,
        min: Math.min(...monthlyValues.filter((v) => v > 0)) || 0,
        monthsWithData: monthlyValues.filter((v) => v > 0).length,
        totalMonths: monthlyValues.length,
      };
    } else {
      const dailyValues = chartData.map((d) => d.value);
      const avgDaily = Math.round(totalSteps / (dailyValues.length || 1));
      const maxDaily = Math.max(...dailyValues);

      statsToReturn = {
        total: totalSteps,
        average: avgDaily,
        max: maxDaily,
        min: Math.min(...dailyValues.filter((v) => v > 0)) || 0,
        daysWithData: dailyValues.filter((v) => v > 0).length,
        totalDays: dailyValues.length,
      };
    }

    return NextResponse.json({
      data: chartData,
      stats: statsToReturn,
      period,
      selectedDate,
    });
  } catch (error) {
    console.error('Error fetching steps data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch steps data' },
      { status: 500 }
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

    // Check if ANY data exists for this date
    const existingData = await prisma.biometric_data.findFirst({
      where: {
        patient_id: patientId,
        metric_type: 'steps',
        timestamp: {
          gte: date,
          lte: new Date(date.getTime() + 24 * 60 * 60 * 1000 - 1)
        }
      },
      select: { source: true }
    });

    if (existingData) {
      return NextResponse.json(
        { 
          error: 'Cannot generate data for this date',
          message: `Data already exists for ${date.toISOString().split('T')[0]} (source: ${existingData.source}). Please delete existing data first to generate simulated data.`
        },
        { status: 409 }
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