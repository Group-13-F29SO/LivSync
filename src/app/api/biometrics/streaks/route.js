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
    const metric = url.searchParams.get('metric') || 'steps';
    const daysBack = parseInt(url.searchParams.get('daysBack')) || 365;

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

    // Fetch biometric data for the period
    const biometricData = await prisma.biometric_data.findMany({
      where: {
        patient_id: patientId,
        metric_type: metric,
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { timestamp: 'asc' },
    });

    // Group data by day and calculate daily totals
    const dailyTotals = new Map();

    biometricData.forEach((entry) => {
      const date = new Date(entry.timestamp);
      const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD format

      if (!dailyTotals.has(dateKey)) {
        dailyTotals.set(dateKey, 0);
      }

      const currentTotal = dailyTotals.get(dateKey);
      dailyTotals.set(dateKey, currentTotal + parseFloat(entry.value));
    });

    // Get all dates in range, sorted
    const allDates = [];
    const current = new Date(startDate);
    while (current <= endDate) {
      allDates.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
    }

    // Calculate streaks
    let currentStreak = 0;
    let longestStreak = 0;
    let longestStreakEnd = null;
    let streakStartDate = null;

    // Calculate current streak (from most recent backwards)
    const sortedDates = Array.from(dailyTotals.keys()).sort().reverse();

    for (const dateStr of sortedDates) {
      const dailyValue = dailyTotals.get(dateStr);
      if (dailyValue >= targetValue) {
        currentStreak++;
      } else {
        break;
      }
    }

    // Calculate longest streak
    let tempStreak = 0;
    let tempStreakStart = null;

    for (const dateStr of Array.from(dailyTotals.keys()).sort()) {
      const dailyValue = dailyTotals.get(dateStr);
      if (dailyValue >= targetValue) {
        if (tempStreak === 0) {
          tempStreakStart = dateStr;
        }
        tempStreak++;

        if (tempStreak > longestStreak) {
          longestStreak = tempStreak;
          longestStreakEnd = dateStr;
        }
      } else {
        tempStreak = 0;
      }
    }

    // Build streak history data
    const streakHistory = [];
    let historyStreak = 0;
    let historyStreakStart = null;

    for (const dateStr of Array.from(dailyTotals.keys()).sort()) {
      const dailyValue = dailyTotals.get(dateStr);
      const goalAchieved = dailyValue >= targetValue;

      if (goalAchieved) {
        if (historyStreak === 0) {
          historyStreakStart = dateStr;
        }
        historyStreak++;
      } else {
        if (historyStreak > 0) {
          streakHistory.push({
            startDate: historyStreakStart,
            endDate: Array.from(dailyTotals.keys())
              .sort()
              .filter((d) => dailyTotals.get(d) >= targetValue)
              .slice(
                Array.from(dailyTotals.keys())
                  .sort()
                  .indexOf(historyStreakStart)
              )[historyStreak - 1],
            length: historyStreak,
          });
        }
        historyStreak = 0;
        historyStreakStart = null;
      }
    }

    // Add the last streak if it's still ongoing
    if (historyStreak > 0) {
      streakHistory.push({
        startDate: historyStreakStart,
        endDate: Array.from(dailyTotals.keys()).sort()[
          Array.from(dailyTotals.keys()).sort().length - 1
        ],
        length: historyStreak,
      });
    }

    // Sort by most recent first
    streakHistory.sort(
      (a, b) => new Date(b.endDate) - new Date(a.endDate)
    );

    return NextResponse.json(
      {
        currentStreak,
        longestStreak,
        goalValue: targetValue,
        metric,
        streakHistory: streakHistory.slice(0, 10), // Return top 10 streaks
        dailyData: Object.fromEntries(dailyTotals),
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
