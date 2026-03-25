import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

function getAuthenticatedUser(request) {
  const cookie = request.cookies.get('livsync_session');
  
  if (!cookie) {
    return null;
  }

  try {
    const session = JSON.parse(cookie.value);
    return session;
  } catch (error) {
    console.error('Failed to parse session cookie:', error);
    return null;
  }
}

// GET - Fetch critical events for a patient
export async function GET(request) {
  try {
    const session = getAuthenticatedUser(request);
    if (!session || !session.userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit')) || 50;
    const offset = parseInt(searchParams.get('offset')) || 0;
    const acknowledged = searchParams.get('acknowledged');

    const where = { patient_id: session.userId };
    if (acknowledged !== null) {
      where.is_acknowledged = acknowledged === 'true';
    }

    const [events, total] = await Promise.all([
      prisma.critical_events.findMany({
        where,
        orderBy: { created_at: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.critical_events.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: events.map((e) => ({
        id: e.id,
        metricType: e.metric_type,
        value: parseFloat(e.value),
        thresholdType: e.threshold_type,
        thresholdValue: parseFloat(e.threshold_value),
        isAcknowledged: e.is_acknowledged,
        createdAt: e.created_at,
        acknowledgedAt: e.acknowledged_at,
      })),
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });
  } catch (error) {
    console.error('Error fetching critical events:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch critical events' },
      { status: 500 }
    );
  }
}

// POST - Create a critical event
export async function POST(request) {
  try {
    const session = getAuthenticatedUser(request);
    if (!session || !session.userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { metricType, value, thresholdType, thresholdValue } = body;

    if (!metricType || !value || !thresholdType || !thresholdValue) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const event = await prisma.critical_events.create({
      data: {
        patient_id: session.userId,
        metric_type: metricType,
        value: parseFloat(value),
        threshold_type: thresholdType,
        threshold_value: parseFloat(thresholdValue),
        is_acknowledged: false,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: event.id,
        metricType: event.metric_type,
        value: parseFloat(event.value),
        thresholdType: event.threshold_type,
        thresholdValue: parseFloat(event.threshold_value),
        isAcknowledged: event.is_acknowledged,
      },
    });
  } catch (error) {
    console.error('Error creating critical event:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create critical event' },
      { status: 500 }
    );
  }
}
