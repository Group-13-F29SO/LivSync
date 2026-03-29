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
    const patientId = searchParams.get('patientId');
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const allHistory = searchParams.get('allHistory') === 'true';

    // Validation
    if (!patientId) {
      return NextResponse.json(
        { error: 'Patient ID is required' },
        { status: 400 }
      );
    }

    // Get the provider from session to verify access
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

    const providerId = session.userId;

    // Verify that the provider has access to this patient
    const patient = await prisma.patients.findFirst({
      where: {
        id: patientId,
        provider_id: providerId,
      },
      select: {
        id: true,
        first_name: true,
        last_name: true,
      },
    });

    if (!patient) {
      return NextResponse.json(
        { error: 'Patient not found or access denied' },
        { status: 404 }
      );
    }

    // Calculate date range based on allHistory flag
    let startDate;
    let endDate;

    if (allHistory) {
      // Fetch all events - set date range to beginning of time and current
      startDate = new Date('2000-01-01');
      endDate = new Date();
      endDate.setHours(23, 59, 59, 999);
    } else {
      // Default: last 30 days if no dates provided
      const now = new Date();
      startDate = new Date(now);
      endDate = new Date(now);

      if (startDateParam && endDateParam) {
        const parsedStart = new Date(startDateParam);
        const parsedEnd = new Date(endDateParam);

        if (!isNaN(parsedStart.getTime()) && !isNaN(parsedEnd.getTime())) {
          startDate = new Date(parsedStart);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(parsedEnd);
          endDate.setHours(23, 59, 59, 999);
        }
      } else {
        // Default: last 30 days
        startDate.setDate(startDate.getDate() - 30);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
      }
    }

    // Fetch critical events from database (not calculated from biometric data)
    const criticalEvents = await prisma.critical_events.findMany({
      where: {
        patient_id: patientId,
        created_at: {
          gte: startDate,
          lte: endDate,
        },
        // By default, only show unread events unless viewing history
        ...(allHistory ? {} : { provider_acknowledged: false }),
      },
      orderBy: {
        created_at: 'desc',
      },
      take: allHistory ? 500 : 50,
    });

    // Format events for response
    const formattedEvents = criticalEvents.map(event => {
      let name = 'Health Alert';
      let status = 'warning';
      let statusColor = 'orange';

      if (event.metric_type === 'heart_rate') {
        name = event.threshold_type === 'max' ? 'High Heart Rate' : 'Low Heart Rate';
        status = 'critical';
        statusColor = 'red';
      } else if (event.metric_type === 'blood_glucose') {
        if (event.threshold_type === 'max') {
          name = 'Elevated Blood Glucose';
          status = 'warning';
          statusColor = 'orange';
        } else if (event.threshold_type === 'min') {
          name = 'Low Blood Sugar';
          status = 'critical';
          statusColor = 'red';
        }
      }

      return {
        id: event.id,
        name,
        status,
        reading: `${Math.round(event.value)} ${event.metric_type === 'heart_rate' ? 'bpm' : 'mg/dL'}`,
        timestamp: formatTimestamp(event.created_at),
        statusColor,
        isAcknowledged: event.provider_acknowledged,
        patientName: `${patient.first_name} ${patient.last_name}`,
      };
    });

    return NextResponse.json({
      success: true,
      events: formattedEvents,
      patientCount: 1,
      patientsWithEvents: 1,
      isHistoryView: allHistory,
    });
  } catch (error) {
    console.error('Error fetching critical events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch critical events' },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');

    // Validation
    if (!patientId) {
      return NextResponse.json(
        { error: 'Patient ID is required' },
        { status: 400 }
      );
    }

    // Get the provider from session to verify access
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

    const providerId = session.userId;

    // Verify that the provider has access to this patient
    const patient = await prisma.patients.findFirst({
      where: {
        id: patientId,
        provider_id: providerId,
      },
    });

    if (!patient) {
      return NextResponse.json(
        { error: 'Patient not found or access denied' },
        { status: 404 }
      );
    }

    // Mark all critical events as acknowledged by provider (read for provider view)
    const result = await prisma.critical_events.updateMany({
      where: {
        patient_id: patientId,
        provider_acknowledged: false,
      },
      data: {
        provider_acknowledged: true,
        provider_acknowledged_at: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: `Marked ${result.count} critical events as read`,
      markedCount: result.count,
    });
  } catch (error) {
    console.error('Error deleting critical events:', error);
    return NextResponse.json(
      { error: 'Failed to clear critical events' },
      { status: 500 }
    );
  }
}

function formatTimestamp(date) {
  const d = new Date(date);
  const month = d.toLocaleString('en-US', { month: 'short' });
  const day = String(d.getDate()).padStart(2, '0');
  const year = d.getFullYear();
  const time = d.toLocaleString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });
  
  return `${month} ${day}, ${year} — ${time}`;
}
