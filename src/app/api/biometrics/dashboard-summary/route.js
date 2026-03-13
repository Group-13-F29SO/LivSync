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
    const weekStart = startOfWeek();

    const [
      stepsAgg,
      caloriesAgg,
      hydrationAgg,
      latestHeartRate,
      latestSleep,
      latestBloodGlucose,
      workoutsThisWeek,
    ] = await Promise.all([
      prisma.biometric_data.aggregate({
        where: {
          patient_id: patientId,
          metric_type: 'steps',
          source: 'apple_health',
          timestamp: { gte: today },
        },
        _sum: { value: true },
      }),

      prisma.biometric_data.aggregate({
        where: {
          patient_id: patientId,
          metric_type: 'calories',
          source: 'apple_health',
          timestamp: { gte: today },
        },
        _sum: { value: true },
      }),

      prisma.biometric_data.aggregate({
        where: {
          patient_id: patientId,
          metric_type: 'hydration',
          source: 'apple_health',
          timestamp: { gte: today },
        },
        _sum: { value: true },
      }),

      prisma.biometric_data.findFirst({
        where: {
          patient_id: patientId,
          metric_type: 'heart_rate',
          source: 'apple_health',
        },
        orderBy: { timestamp: 'desc' },
      }),

      prisma.biometric_data.findFirst({
        where: {
          patient_id: patientId,
          metric_type: 'sleep',
          source: 'apple_health',
        },
        orderBy: { timestamp: 'desc' },
      }),

      prisma.biometric_data.findFirst({
        where: {
          patient_id: patientId,
          metric_type: 'blood_glucose',
          source: 'apple_health',
        },
        orderBy: { timestamp: 'desc' },
      }),

      prisma.biometric_data.count({
        where: {
          patient_id: patientId,
          metric_type: 'workouts',
          source: 'apple_health',
          timestamp: { gte: weekStart },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        steps: Math.round(Number(stepsAgg._sum.value || 0)),
        calories: Math.round(Number(caloriesAgg._sum.value || 0)),
        hydration: Math.round(Number(hydrationAgg._sum.value || 0)),
        heart_rate: latestHeartRate ? Number(latestHeartRate.value) : 0,
        sleep: latestSleep ? Number(latestSleep.value) : 0,
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