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

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfTomorrow() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 1);
  return d;
}

function startOfWeek() {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day;
  const start = new Date(d.setDate(diff));
  start.setHours(0, 0, 0, 0);
  return start;
}

export async function GET() {
  try {
    const session = getSession();

    if (!session || !session.userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const patientId = session.userId;
    const today = startOfToday();
    const tomorrow = startOfTomorrow();
    const weekStart = startOfWeek();

    const [
      stepsAgg,
      caloriesAgg,
      latestHeartRate,
      latestSleep,
      latestBloodGlucose,
      workoutsThisWeek,
      hydrationResponse,
    ] = await Promise.all([
      prisma.biometric_data.aggregate({
        where: {
          patient_id: patientId,
          metric_type: 'steps',
          timestamp: { gte: today, lt: tomorrow },
        },
        _sum: { value: true },
      }),

      prisma.biometric_data.aggregate({
        where: {
          patient_id: patientId,
          metric_type: 'calories',
          timestamp: { gte: today, lt: tomorrow },
        },
        _sum: { value: true },
      }),

      prisma.biometric_data.findFirst({
        where: {
          patient_id: patientId,
          metric_type: 'heart_rate',
        },
        orderBy: { timestamp: 'desc' },
      }),

      prisma.biometric_data.aggregate({
        where: {
          patient_id: patientId,
          metric_type: 'sleep',
          timestamp: { gte: today, lt: tomorrow },
        },
        _max: { value: true },
      }),

      prisma.biometric_data.findFirst({
        where: {
          patient_id: patientId,
          metric_type: 'blood_glucose',
        },
        orderBy: { timestamp: 'desc' },
      }),

      prisma.biometric_data.count({
        where: {
          patient_id: patientId,
          metric_type: 'workouts',
          timestamp: { gte: weekStart },
        },
      }),
      
      // Fetch hydration data using the same logic as the hydration metric page
      (async () => {
        const hydrationData = await prisma.biometric_data.findMany({
          where: {
            patient_id: patientId,
            metric_type: 'hydration',
            timestamp: {
              gte: today,
              lt: tomorrow
            }
          },
          orderBy: { timestamp: 'asc' }
        });
        
        if (!hydrationData || hydrationData.length === 0) {
          return { stats: null };
        }
        
        // Get the latest (end of day) hydration value
        const values = hydrationData.map(item => Number(item.value));
        const latest = values[values.length - 1] || 0;
        
        return { stats: { latest } };
      })(),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        steps: Math.round(Number(stepsAgg._sum.value || 0)),
        calories: Math.round(Number(caloriesAgg._sum.value || 0)),
        hydration: hydrationResponse.stats ? Math.round(hydrationResponse.stats.latest) : 0,
        heart_rate: latestHeartRate ? Number(latestHeartRate.value) : 0,
        sleep: latestSleep._max.value ? Number(latestSleep._max.value.toFixed(1)) : 0,
        blood_glucose: latestBloodGlucose ? Number(latestBloodGlucose.value) : 0,
        workouts: workoutsThisWeek,
      },
    });
  } catch (error) {
    console.error('Dashboard summary error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve dashboard summary' },
      { status: 500 }
    );
  }
}