import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

/**
 * Calculate streak data for a specific metric
 * A streak is counted as consecutive days where the goal was achieved
 */
export async function GET(req) {
  try {
    // Get the session from cookies
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
    const url = new URL(req.url);
    let metric = url.searchParams.get('metric') || 'steps';
    const daysBack = parseInt(url.searchParams.get('daysBack')) || 365;

    // Map goal catalog metric names to database metric names
    const metricMapping = {
      water: 'hydration',
      calories: 'calories',
      steps: 'steps',
      sleep: 'sleep',
    };

    // Convert goal name to database metric name if needed
    const dbMetric = metricMapping[metric] || metric;

    // Fetch the goal for this metric
    const goal = await prisma.goals.findFirst({
      where: {
        patient_id: patientId,
        metric_type: metric,
        is_active: true,
      },
    });

    if (!goal) {
      return NextResponse.json(
        {
          currentStreak: 0,
          longestStreak: 0,
          streakHistory: [],
          goalNotFound: true,
        },
        { status: 200 }
      );
    }

    const targetValue = goal.target_value;

    // Calculate date range
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);
    startDate.setHours(0, 0, 0, 0);

    // Fetch biometric data for the period using the database metric name
    const biometricData = await prisma.biometric_data.findMany({
      where: {
        patient_id: patientId,
        metric_type: dbMetric,
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { timestamp: 'asc' },
    });

    // Group data by day and calculate daily totals
    // Different metrics need different aggregation strategies
    const dailyTotals = new Map();

    biometricData.forEach((entry) => {
      const date = new Date(entry.timestamp);
      const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD format

      if (!dailyTotals.has(dateKey)) {
        dailyTotals.set(dateKey, null);
      }

      const value = parseFloat(entry.value);
      
      // Different metrics use different aggregation strategies
      if (dbMetric === 'sleep') {
        // For sleep: take the maximum value (it's a daily duration, not cumulative)
        const currentValue = dailyTotals.get(dateKey);
        if (currentValue === null || value > currentValue) {
          dailyTotals.set(dateKey, value);
        }
      } else {
        // For steps, calories, hydration: sum all readings (cumulative throughout day)
        const currentTotal = dailyTotals.get(dateKey) || 0;
        dailyTotals.set(dateKey, currentTotal + value);
      }
    });

    // Get all dates in range, sorted
    const allDates = [];
    const current = new Date(startDate);
    while (current <= endDate) {
      allDates.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
    }

    // Calculate streaks - iterate through all dates in range
    let currentStreak = 0;

    // Calculate current streak (from most recent with data backwards)
    // Get dates that have data, sorted in reverse (most recent first)
    const datesWithData = Array.from(dailyTotals.keys()).sort().reverse();

    for (const dateStr of datesWithData) {
      const dailyValue = dailyTotals.get(dateStr);
      // Count only if goal is achieved
      if (dailyValue >= targetValue) {
        currentStreak++;
      } else {
        // Stop counting when we hit a day that doesn't meet goal
        break;
      }
    }

    return NextResponse.json(
      {
        currentStreak,
        goalValue: targetValue,
        metric,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error calculating streaks:', error);
    return NextResponse.json(
      { error: 'Failed to calculate streaks' },
      { status: 500 }
    );
  }
}
