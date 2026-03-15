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

    // Calculate date range (default: last 30 days)
    const now = new Date();
    let startDate = new Date(now);
    let endDate = new Date(now);

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

    // Fetch all biometric data for the patient in the date range
    const biometricData = await prisma.biometric_data.findMany({
      where: {
        patient_id: patientId,
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
    });

    // Process data to find critical events
    const criticalEvents = [];

    for (const data of biometricData) {
      const value = parseFloat(data.value);

      if (data.metric_type === 'heart_rate') {
        if (value > THRESHOLDS.heart_rate.critical) {
          criticalEvents.push({
            id: `${data.id}-hr`,
            name: 'High Heart Rate',
            status: 'critical',
            reading: `${Math.round(value)} bpm`,
            timestamp: formatTimestamp(data.timestamp),
            statusColor: 'red',
            metricType: 'heart_rate',
            value,
            dateTime: data.timestamp,
          });
        }
      } else if (data.metric_type === 'blood_glucose') {
        let event = null;

        if (value > THRESHOLDS.blood_glucose.critical_high) {
          event = {
            id: `${data.id}-bg-high`,
            name: 'Elevated Blood Glucose',
            status: 'warning',
            reading: `${Math.round(value)} mg/dL`,
            timestamp: formatTimestamp(data.timestamp),
            statusColor: 'orange',
            metricType: 'blood_glucose',
            value,
            dateTime: data.timestamp,
          };
        } else if (value < THRESHOLDS.blood_glucose.critical_low) {
          event = {
            id: `${data.id}-bg-low`,
            name: 'Low Blood Sugar',
            status: 'critical',
            reading: `${Math.round(value)} mg/dL`,
            timestamp: formatTimestamp(data.timestamp),
            statusColor: 'red',
            metricType: 'blood_glucose',
            value,
            dateTime: data.timestamp,
          };
        }

        if (event) {
          criticalEvents.push(event);
        }
      }
    }

    // Sort by timestamp (most recent first)
    criticalEvents.sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime));

    // Limit to 50 most recent events
    const limitedEvents = criticalEvents.slice(0, 50);

    return NextResponse.json({
      success: true,
      events: limitedEvents.map(event => ({
        id: event.id,
        name: event.name,
        status: event.status,
        reading: event.reading,
        timestamp: event.timestamp,
        statusColor: event.statusColor,
      })),
    });
  } catch (error) {
    console.error('Error fetching critical events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch critical events' },
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
