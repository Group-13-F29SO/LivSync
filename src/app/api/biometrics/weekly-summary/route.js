import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

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

function getStartOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  const start = new Date(d.setDate(diff));
  start.setHours(0, 0, 0, 0);
  return start;
}

function getEndOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + 6;
  const end = new Date(d.setDate(diff));
  end.setHours(23, 59, 59, 999);
  return end;
}

function getSleepQuality(hours) {
  if (hours < 4) return 'Poor';
  if (hours < 6) return 'Fair';
  if (hours < 7) return 'Good';
  if (hours <= 9) return 'Excellent';
  return 'Excessive';
}

function getBloodGlucoseStatus(value) {
  if (value < 70) return 'Low';
  if (value <= 140) return 'Normal';
  if (value <= 180) return 'Elevated';
  return 'High';
}

export async function GET(request) {
  try {
    const session = getSession();

    if (!session || !session.userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const patientId = session.userId;
    const { searchParams } = new URL(request.url);
    const weeksParam = parseInt(searchParams.get('weeks')) || 12; // Default to last 12 weeks
    const startDateParam = searchParams.get('startDate');

    // Calculate the date range
    let startDate;
    if (startDateParam) {
      startDate = new Date(startDateParam);
    } else {
      startDate = new Date();
      startDate.setDate(startDate.getDate() - weeksParam * 7);
    }

    startDate = getStartOfWeek(startDate);
    const endDate = new Date();

    // First, fetch all biometric data in the date range to determine which weeks have data
    const allData = await prisma.biometric_data.findMany({
      where: {
        patient_id: patientId,
        timestamp: { gte: startDate, lte: endDate },
      },
      select: { timestamp: true },
    });

    // No data at all? Return empty array
    if (allData.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        totalWeeks: 0,
      });
    }

    // Determine which weeks have data
    const weeksWithData = new Set();
    allData.forEach((record) => {
      const weekStart = getStartOfWeek(new Date(record.timestamp));
      const weekKey = weekStart.toISOString().split('T')[0];
      weeksWithData.add(weekKey);
    });

    // Generate list of weeks that have data
    const weeks = [];
    let currentWeekStart = new Date(startDate);

    while (currentWeekStart <= endDate) {
      const weekKey = currentWeekStart.toISOString().split('T')[0];
      if (weeksWithData.has(weekKey)) {
        const weekEnd = getEndOfWeek(currentWeekStart);
        weeks.push({
          start: new Date(currentWeekStart),
          end: weekEnd,
        });
      }
      currentWeekStart.setDate(currentWeekStart.getDate() + 7);
    }

    // Fetch aggregated data for each week with data
    const weeklyData = await Promise.all(
      weeks.map(async (week) => {
        // Fetch raw data for proper daily aggregation
        const [stepsData, caloriesData, sleepData, hydrationData, heartRateData, bloodGlucoseData, workoutCount] =
          await Promise.all([
            // Steps - need to get daily total, then sum and average
            prisma.biometric_data.findMany({
              where: {
                patient_id: patientId,
                metric_type: 'steps',
                timestamp: { gte: week.start, lte: week.end },
              },
              select: { value: true, timestamp: true },
            }),

            // Calories - need to get daily total, then sum and average
            prisma.biometric_data.findMany({
              where: {
                patient_id: patientId,
                metric_type: 'calories',
                timestamp: { gte: week.start, lte: week.end },
              },
              select: { value: true, timestamp: true },
            }),

            // Sleep - need to get max per day, then sum and average
            prisma.biometric_data.findMany({
              where: {
                patient_id: patientId,
                metric_type: 'sleep',
                timestamp: { gte: week.start, lte: week.end },
              },
              select: { value: true, timestamp: true },
            }),

            // Hydration - need to get max per day, then sum and average
            prisma.biometric_data.findMany({
              where: {
                patient_id: patientId,
                metric_type: 'hydration',
                timestamp: { gte: week.start, lte: week.end },
              },
              select: { value: true, timestamp: true },
            }),

            // Heart Rate - average is fine
            prisma.biometric_data.aggregate({
              where: {
                patient_id: patientId,
                metric_type: 'heart_rate',
                timestamp: { gte: week.start, lte: week.end },
              },
              _avg: { value: true },
            }),

            // Blood Glucose - average is fine
            prisma.biometric_data.aggregate({
              where: {
                patient_id: patientId,
                metric_type: 'blood_glucose',
                timestamp: { gte: week.start, lte: week.end },
              },
              _avg: { value: true },
            }),

            prisma.biometric_data.count({
              where: {
                patient_id: patientId,
                metric_type: 'workouts',
                timestamp: { gte: week.start, lte: week.end },
              },
            }),
          ]);

        // Helper function to get date key from timestamp
        const getDateKey = (timestamp) => {
          const d = new Date(timestamp);
          return d.toISOString().split('T')[0];
        };

        // Process steps: get daily total, then average
        const stepsDaily = {};
        stepsData.forEach((record) => {
          const dateKey = getDateKey(record.timestamp);
          stepsDaily[dateKey] = (stepsDaily[dateKey] || 0) + Number(record.value);
        });
        const stepsDailyValues = Object.values(stepsDaily);
        const stepsTotal = stepsDailyValues.reduce((a, b) => a + b, 0);
        const stepsAverage = stepsDailyValues.length > 0 ? Math.round(stepsTotal / stepsDailyValues.length) : 0;

        // Process calories: get daily total, then average
        const caloriesDaily = {};
        caloriesData.forEach((record) => {
          const dateKey = getDateKey(record.timestamp);
          caloriesDaily[dateKey] = (caloriesDaily[dateKey] || 0) + Number(record.value);
        });
        const caloriesDailyValues = Object.values(caloriesDaily);
        const caloriesTotal = caloriesDailyValues.reduce((a, b) => a + b, 0);
        const caloriesAverage = caloriesDailyValues.length > 0 ? Math.round(caloriesTotal / caloriesDailyValues.length) : 0;

        // Process sleep: get max per day, then sum and average
        const sleepDaily = {};
        sleepData.forEach((record) => {
          const dateKey = getDateKey(record.timestamp);
          const value = Number(record.value);
          sleepDaily[dateKey] = Math.max(sleepDaily[dateKey] || 0, value);
        });
        const sleepDailyValues = Object.values(sleepDaily);
        const sleepTotal = sleepDailyValues.reduce((a, b) => a + b, 0);
        const sleepAverage = sleepDailyValues.length > 0 ? sleepTotal / sleepDailyValues.length : 0;

        // Process hydration: get max per day, then sum and average
        const hydrationDaily = {};
        hydrationData.forEach((record) => {
          const dateKey = getDateKey(record.timestamp);
          const value = Number(record.value);
          hydrationDaily[dateKey] = Math.max(hydrationDaily[dateKey] || 0, value);
        });
        const hydrationDailyValues = Object.values(hydrationDaily);
        const hydrationTotal = hydrationDailyValues.reduce((a, b) => a + b, 0);
        const hydrationAverage = hydrationDailyValues.length > 0 ? Math.round(hydrationTotal / hydrationDailyValues.length) : 0;

        const avgHeartRate = heartRateData._avg.value ? Math.round(Number(heartRateData._avg.value)) : 0;
        const avgBloodGlucose = bloodGlucoseData._avg.value ? Math.round(Number(bloodGlucoseData._avg.value)) : 0;

        return {
          weekStart: week.start.toISOString().split('T')[0],
          weekEnd: week.end.toISOString().split('T')[0],
          steps: {
            total: Math.round(stepsTotal),
            average: stepsAverage,
          },
          calories: {
            total: Math.round(caloriesTotal),
            average: caloriesAverage,
          },
          sleep: {
            totalHours: Number(sleepTotal.toFixed(1)),
            averageHours: Number(sleepAverage.toFixed(1)),
            quality: getSleepQuality(Number(sleepAverage.toFixed(1))),
          },
          hydration: {
            total: Math.round(hydrationTotal),
            average: hydrationAverage,
          },
          heartRate: {
            average: avgHeartRate,
          },
          bloodGlucose: {
            average: avgBloodGlucose,
            status: getBloodGlucoseStatus(avgBloodGlucose),
          },
          workouts: workoutCount,
        };
      })
    );

    // Sort weeks in descending order (most recent first)
    weeklyData.sort((a, b) => new Date(b.weekStart) - new Date(a.weekStart));

    return NextResponse.json({
      success: true,
      data: weeklyData,
      totalWeeks: weeklyData.length,
    });
  } catch (error) {
    console.error('Weekly summary error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve weekly summary' },
      { status: 500 }
    );
  }
}
