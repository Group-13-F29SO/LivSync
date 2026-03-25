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

// GET - Fetch all alert thresholds for a patient
export async function GET(request) {
  try {
    const session = getAuthenticatedUser(request);
    if (!session || !session.userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const thresholds = await prisma.alert_thresholds.findMany({
      where: {
        patient_id: session.userId,
        is_active: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: thresholds.map((t) => ({
        id: t.id,
        metricType: t.metric_type,
        minValue: t.min_value ? parseFloat(t.min_value) : null,
        maxValue: t.max_value ? parseFloat(t.max_value) : null,
        isActive: t.is_active,
        createdAt: t.created_at,
        updatedAt: t.updated_at,
      })),
    });
  } catch (error) {
    console.error('Error fetching alert thresholds:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch alert thresholds' },
      { status: 500 }
    );
  }
}

// POST - Create or update alert threshold for a metric
export async function POST(request) {
  try {
    const session = getAuthenticatedUser(request);
    if (!session || !session.userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { metricType, minValue, maxValue } = body;

    if (!metricType) {
      return NextResponse.json(
        { success: false, error: 'metricType is required' },
        { status: 400 }
      );
    }

    // Both min and max should be provided for meaningful thresholds
    if (minValue === undefined || minValue === null || maxValue === undefined || maxValue === null) {
      return NextResponse.json(
        { success: false, error: 'Both minValue and maxValue are required' },
        { status: 400 }
      );
    }

    // Validate that min < max
    if (parseFloat(minValue) >= parseFloat(maxValue)) {
      return NextResponse.json(
        { success: false, error: 'minValue must be less than maxValue' },
        { status: 400 }
      );
    }

    // Upsert the threshold
    const threshold = await prisma.alert_thresholds.upsert({
      where: {
        patient_id_metric_type: {
          patient_id: session.userId,
          metric_type: metricType,
        },
      },
      update: {
        min_value: parseFloat(minValue),
        max_value: parseFloat(maxValue),
        is_active: true,
        updated_at: new Date(),
      },
      create: {
        patient_id: session.userId,
        metric_type: metricType,
        min_value: parseFloat(minValue),
        max_value: parseFloat(maxValue),
        is_active: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: threshold.id,
        metricType: threshold.metric_type,
        minValue: parseFloat(threshold.min_value),
        maxValue: parseFloat(threshold.max_value),
        isActive: threshold.is_active,
      },
    });
  } catch (error) {
    console.error('Error saving alert threshold:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save alert threshold' },
      { status: 500 }
    );
  }
}
