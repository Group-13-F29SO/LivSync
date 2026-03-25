import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// POST - Check if a biometric value breaches thresholds and create event if needed
export async function POST(request) {
  try {
    const body = await request.json();
    const { patientId, metricType, value } = body;

    if (!patientId || !metricType || value === undefined) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Fetch the patient's threshold for this metric
    const threshold = await prisma.alert_thresholds.findUnique({
      where: {
        unique_patient_metric_threshold: {
          patient_id: patientId,
          metric_type: metricType,
        },
      },
    });

    const numValue = parseFloat(value);
    const breached = [];

    if (threshold && threshold.is_active) {
      if (threshold.min_value && numValue < parseFloat(threshold.min_value)) {
        breached.push({
          type: 'min',
          value: parseFloat(threshold.min_value),
        });
      }
      if (threshold.max_value && numValue > parseFloat(threshold.max_value)) {
        breached.push({
          type: 'max',
          value: parseFloat(threshold.max_value),
        });
      }
    }

    // Create critical events for each breached threshold
    const createdEvents = [];
    for (const breach of breached) {
      const event = await prisma.critical_events.create({
        data: {
          patient_id: patientId,
          metric_type: metricType,
          value: numValue,
          threshold_type: breach.type,
          threshold_value: breach.value,
          is_acknowledged: false,
        },
      });
      createdEvents.push(event);
    }

    return NextResponse.json({
      success: true,
      breached: breached.length > 0,
      events: createdEvents.map((e) => ({
        id: e.id,
        metricType: e.metric_type,
        value: e.value,
        thresholdType: e.threshold_type,
        thresholdValue: e.threshold_value,
      })),
    });
  } catch (error) {
    console.error('Error checking alert thresholds:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check alert thresholds' },
      { status: 500 }
    );
  }
}
