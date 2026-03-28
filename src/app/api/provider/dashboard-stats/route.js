import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Define thresholds for critical events
const THRESHOLDS = {
  heart_rate: {
    critical: 140, // > 140 bpm is critical
  },
  blood_glucose: {
    critical_high: 180, // > 180 mg/dL is high
    critical_low: 70,   // < 70 mg/dL is critical
  },
};

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const providerId = searchParams.get('providerId');

    // Validation
    if (!providerId) {
      return NextResponse.json(
        { error: 'Provider ID is required' },
        { status: 400 }
      );
    }

    // Get the provider from session to verify authorization
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

    // Verify that the providerId matches the session user
    if (session.userId !== providerId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get all patients for this provider
    const patients = await prisma.patients.findMany({
      where: {
        provider_id: providerId,
      },
      select: {
        id: true,
      },
    });

    const patientIds = patients.map(p => p.id);

    if (patientIds.length === 0) {
      return NextResponse.json({
        critical: 0,
        warnings: 0,
      });
    }

    // Get biometric data from the last 24 hours for all patients
    const last24HoursDate = new Date();
    last24HoursDate.setHours(last24HoursDate.getHours() - 24);

    const biometricData = await prisma.biometric_data.findMany({
      where: {
        patient_id: {
          in: patientIds,
        },
        timestamp: {
          gte: last24HoursDate,
        },
      },
    });

    // Count critical events (individual readings), patients with critical events, and patients with warnings
    let criticalCount = 0;
    let warningCount = 0;
    const patientsWithCritical = new Set();
    const patientsWithWarnings = new Set();

    for (const data of biometricData) {
      const value = parseFloat(data.value);

      if (data.metric_type === 'heart_rate') {
        if (value > THRESHOLDS.heart_rate.critical) {
          criticalCount++;
          patientsWithCritical.add(data.patient_id);
        }
      } else if (data.metric_type === 'blood_glucose') {
        if (value > THRESHOLDS.blood_glucose.critical_high) {
          warningCount++;
          patientsWithWarnings.add(data.patient_id);
        } else if (value < THRESHOLDS.blood_glucose.critical_low) {
          criticalCount++;
          patientsWithCritical.add(data.patient_id);
        }
      }
    }

    return NextResponse.json({
      critical: criticalCount,
      criticalPatients: patientsWithCritical.size,
      warnings: warningCount,
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
}
