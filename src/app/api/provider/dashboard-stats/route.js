import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

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
        criticalPatients: 0,
      });
    }

    // Get unread critical events from the last 24 hours for all patients (from provider perspective)
    const last24HoursDate = new Date();
    last24HoursDate.setHours(last24HoursDate.getHours() - 24);

    const unreadCriticalEvents = await prisma.critical_events.findMany({
      where: {
        patient_id: {
          in: patientIds,
        },
        provider_acknowledged: false,
        created_at: {
          gte: last24HoursDate,
        },
      },
    });

    // Count events by severity
    let criticalCount = 0;
    let warningCount = 0;
    const patientsWithCritical = new Set();
    const patientsWithWarnings = new Set();

    for (const event of unreadCriticalEvents) {
      if (event.metric_type === 'heart_rate' || (event.metric_type === 'blood_glucose' && event.threshold_type === 'min')) {
        // Heart rate and low blood glucose are critical
        criticalCount++;
        patientsWithCritical.add(event.patient_id);
      } else if (event.metric_type === 'blood_glucose' && event.threshold_type === 'max') {
        // High blood glucose is a warning
        warningCount++;
        patientsWithWarnings.add(event.patient_id);
      }
    }

    return NextResponse.json({
      critical: criticalCount,
      criticalPatients: patientsWithCritical.size,
      warnings: warningCount,
      warningPatients: patientsWithWarnings.size,
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
}
