import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import CaloriesGenerator from '@/generators/caloriesGenerator';
import { checkAndAwardNewBadges } from '@/services/badgeEarner';

export async function GET(req) {
  try {
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get('livsync_session');

    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let session;
    try {
      session = JSON.parse(sessionCookie.value);
    } catch {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const patientId = session.userId;

    const url = new URL(req.url);
    const period = url.searchParams.get('period') || 'today';
    const dateParam = url.searchParams.get('date');

    function formatLocalDate(date) {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }

    const latestCalories = await prisma.biometric_data.findFirst({
      where: {
        patient_id: patientId,
        metric_type: 'calories',
      },
      orderBy: { timestamp: 'desc' },
      select: { timestamp: true },
    });

    const anchorDate = latestCalories ? new Date(latestCalories.timestamp) : new Date();

    let startDate;
    let endDate;
    let selectedDate = dateParam;

    if (period === 'today' && !dateParam) {
      selectedDate = formatLocalDate(anchorDate);
    }

    const now = anchorDate;

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
        if (!selectedDate) {
          selectedDate = formatLocalDate(new Date());
        }

        const [year, month, dayOfMonth] = selectedDate.split('-').map(Number);
        startDate = new Date(year, month - 1, dayOfMonth, 0, 0, 0, 0);
        endDate = new Date(year, month - 1, dayOfMonth, 23, 59, 59, 999);
        break;
      }
    }

    const caloriesData = await prisma.biometric_data.findMany({
      where: {
        patient_id: patientId,
        metric_type: 'calories',
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        timestamp: 'asc',
      },
    });

    if (!caloriesData || caloriesData.length === 0) {
      return NextResponse.json({
        data: [],
        message: 'No calories data available',
        stats: null,
        period,
        selectedDate,
      });
    }

    let chartData;

    if (period === 'today') {
      const hourlyCalories = {};

      for (const reading of caloriesData) {
        const time = new Date(reading.timestamp);
        const hour = time.getHours();
        hourlyCalories[hour] = (hourlyCalories[hour] || 0) + Number(reading.value);
      }

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
          date: selectedDate,
        });
      }
    } else if (period === 'year') {
      const monthlyData = new Map();
      const currentDate = new Date(startDate);

      for (let i = 0; i < 12; i++) {
        const monthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
        monthlyData.set(monthKey, {
          totalCalories: 0,
          days: new Set(),
          monthDate: new Date(currentDate),
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
        const [, month] = monthKey.split('-');
        const monthIndex = parseInt(month) - 1;
        const monthName = monthNames[monthIndex];
        const daysCount = data.days.size;
        const avgCaloriesPerDay = daysCount > 0 ? Math.round(data.totalCalories / daysCount) : 0;

        chartData.push({
          timestamp: monthName,
          value: avgCaloriesPerDay,
          totalCalories: data.totalCalories,
          daysWithData: daysCount,
          rawTime: data.monthDate,
        });
      });
    } else {
      const dailyMap = new Map();

      caloriesData.forEach((item) => {
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

    const totalCalories = caloriesData.reduce((sum, item) => sum + Number(item.value), 0);

    // Fetch user's goal for this metric
    let goal = null;
    if (period === 'today') {
      const userGoal = await prisma.goals.findFirst({
        where: {
          patient_id: patientId,
          metric_type: 'calories',
        },
        select: { target_value: true },
      });
      goal = userGoal?.target_value || null;
    }

    let statsToReturn;

    if (period === 'today') {
      const hourlyValues = chartData.map((d) => d.value);
      const maxHourly = Math.max(...hourlyValues);
      const hoursWithData = hourlyValues.filter((v) => v > 0).length || 1;
      const avgHourly = Math.round(totalCalories / hoursWithData);

      statsToReturn = {
        total: totalCalories,
        average: avgHourly,
        max: maxHourly,
        min: Math.min(...hourlyValues.filter((v) => v > 0)) || 0,
        latest: hourlyValues[new Date(anchorDate).getHours()] || 0,
        goalAchieved: goal ? totalCalories >= goal : false,
        goal: goal,
      };
    } else if (period === 'year') {
      // For year view, calculate daily totals to get the peak day
      const yearDailyMap = new Map();
      caloriesData.forEach((item) => {
        const timestamp = new Date(item.timestamp);
        const dateKey = formatLocalDate(timestamp);
        if (!yearDailyMap.has(dateKey)) {
          yearDailyMap.set(dateKey, 0);
        }
        yearDailyMap.set(dateKey, yearDailyMap.get(dateKey) + Number(item.value));
      });
      
      const dailyTotals = Array.from(yearDailyMap.values());
      const maxDaily = dailyTotals.length > 0 ? Math.max(...dailyTotals) : 0;
      const minDaily = dailyTotals.length > 0 ? Math.min(...dailyTotals) : 0;
      
      const daysWithData = yearDailyMap.size;
      const monthlyValues = chartData.map((d) => d.value);
      const avgMonthly = daysWithData > 0 ? Math.round(totalCalories / daysWithData) : 0;

      statsToReturn = {
        total: totalCalories,
        average: avgMonthly,
        max: maxDaily,
        min: minDaily,
        monthsWithData: monthlyValues.filter((v) => v > 0).length,
        totalMonths: monthlyValues.length,
      };
    } else {
      const dailyValues = chartData.map((d) => d.value);
      const daysWithData = dailyValues.filter((v) => v > 0).length;
      const avgDaily = daysWithData > 0 ? Math.round(totalCalories / daysWithData) : 0;
      
      // Get max from daily totals (days with data)
      const maxDaily = Math.max(...dailyValues.filter(v => v > 0)) || 0;
      const minDaily = Math.min(...dailyValues.filter(v => v > 0)) || 0;

      statsToReturn = {
        total: totalCalories,
        average: avgDaily,
        max: maxDaily,
        min: minDaily,
        latest: dailyValues[dailyValues.length - 1] || 0,
        daysWithData: daysWithData,
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
    console.error('Error fetching calories data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch calories data' },
      { status: 500 }
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

    // Check if ANY data exists for this date
    const existingData = await prisma.biometric_data.findFirst({
      where: {
        patient_id: patientId,
        metric_type: 'calories',
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

    // Check for newly earned badges
    let newBadges = [];
    try {
      newBadges = await checkAndAwardNewBadges(patientId);
    } catch (error) {
      console.error('Error checking badges:', error);
      // Don't fail the request if badge checking fails
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Calories data generated successfully',
        date: date.toISOString().split('T')[0],
        dataPointsGenerated: result.count,
        data: caloriesData,
        newBadges: newBadges.filter((b) => b.awarded).map((b) => ({
          id: b.badgeId,
          name: b.badgeName,
        })),
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