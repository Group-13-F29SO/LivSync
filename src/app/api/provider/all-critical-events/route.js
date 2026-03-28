import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const providerId = searchParams.get('providerId');
    const hours = parseInt(searchParams.get('hours')) || null; // null means show unread only

    // Validation
    if (!providerId) {
      return NextResponse.json(
        { error: 'Provider ID is required' },
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

    // Verify authorization
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
        first_name: true,
        last_name: true,
      },
    });

    if (patients.length === 0) {
      return NextResponse.json({
        success: true,
        events: [],
        patientCount: 0,
        patientsWithEvents: 0,
      });
    }

    const patientIds = patients.map(p => p.id);
    const patientMap = Object.fromEntries(patients.map(p => [p.id, `${p.first_name} ${p.last_name}`]));

    // Build the where clause based on time range
    let whereClause = {
      patient_id: {
        in: patientIds,
      },
    };

    // If no hours specified, show only unread events (new events from provider perspective)
    // If hours is specified, show all events in that time range (history view)
    if (hours === null) {
      whereClause.provider_acknowledged = false;
    } else {
      const startDate = new Date();
      startDate.setHours(startDate.getHours() - hours);
      whereClause.created_at = {
        gte: startDate,
      };
    }

    // Fetch critical events from the database
    const criticalEventsFromDb = await prisma.critical_events.findMany({
      where: whereClause,
      orderBy: {
        created_at: 'desc',
      },
    });

    // Map the data from the database to the response format
    const criticalEvents = criticalEventsFromDb.map(event => {
      const value = parseFloat(event.value);
      let name = '';
      let status = '';
      let statusColor = '';

      if (event.metric_type === 'heart_rate') {
        name = 'High Heart Rate';
        status = 'critical';
        statusColor = 'red';
      } else if (event.metric_type === 'blood_glucose') {
        if (event.threshold_type === 'high') {
          name = 'Elevated Blood Glucose';
          status = 'warning';
          statusColor = 'orange';
        } else {
          name = 'Low Blood Sugar';
          status = 'critical';
          statusColor = 'red';
        }
      }

      return {
        id: event.id,
        patientId: event.patient_id,
        patientName: patientMap[event.patient_id],
        name,
        status,
        metricType: event.metric_type,
        value: parseFloat(event.value),
        reading: event.metric_type === 'heart_rate' 
          ? `${Math.round(value)} bpm`
          : `${Math.round(value)} mg/dL`,
        timestamp: formatTimestamp(event.created_at),
        statusColor,
        dateTime: event.created_at,
        isAcknowledged: event.provider_acknowledged,
      };
    });

    // Get unique patients with events
    const patientsWithEvents = new Set(criticalEvents.map(e => e.patientId)).size;

    return NextResponse.json({
      success: true,
      events: criticalEvents,
      patientCount: patients.length,
      patientsWithEvents,
      isHistoryView: hours !== null,
    });
  } catch (error) {
    console.error('Error fetching all critical events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch critical events' },
      { status: 500 }
    );
  }
}

// PATCH - Mark all unread critical events as read for all patients
export async function PATCH(request) {
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

    // Verify authorization
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

    if (patients.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No patients found',
        markedCount: 0,
      });
    }

    const patientIds = patients.map(p => p.id);

    // Mark all unread critical events as read for all patients (from provider perspective)
    const result = await prisma.critical_events.updateMany({
      where: {
        patient_id: {
          in: patientIds,
        },
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
    console.error('Error marking critical events as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark events as read' },
      { status: 500 }
    );
  }
}

// DELETE - Mark all critical events as read for all patients (legacy, same as PATCH)
export async function DELETE(request) {
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

    // Verify authorization
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

    if (patients.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No patients found',
        markedCount: 0,
      });
    }

    const patientIds = patients.map(p => p.id);

    // Mark all critical events as read for all patients (from provider perspective)
    const result = await prisma.critical_events.updateMany({
      where: {
        patient_id: {
          in: patientIds,
        },
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
    console.error('Error marking critical events as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark events as read' },
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
