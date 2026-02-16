/**
 * GET /api/biometrics/summary
 * Get summary statistics for biometric data
 */

import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

/**
 * Check if user is authenticated via session cookie
 */
function getAuthenticatedUser(request) {
  const cookie = request.cookies.get('livsync_session');
  
  if (!cookie) {
    return null;
  }

  try {
    const session = JSON.parse(cookie.value);
    return session;
  } catch (error) {
    return null;
  }
}

/**
 * Calculate summary statistics for metrics
 */
function calculateMetricSummaries(data) {
  const summaries = {};

  // Group by metric type
  const byMetric = {};
  data.forEach(point => {
    if (!byMetric[point.metric_type]) {
      byMetric[point.metric_type] = [];
    }
    byMetric[point.metric_type].push(parseFloat(point.value));
  });

  // Calculate stats for each metric
  for (const [metricType, values] of Object.entries(byMetric)) {
    if (values.length > 0) {
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      const min = Math.min(...values);
      const max = Math.max(...values);

      summaries[metricType] = {
        avg: Math.round(avg * 100) / 100,
        min: Math.round(min * 100) / 100,
        max: Math.round(max * 100) / 100,
        count: values.length
      };
    }
  }

  return summaries;
}

export async function GET(request) {
  try {
    // Authenticate user
    const session = getAuthenticatedUser(request);
    
    if (!session || !session.userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const patientId = session.userId;

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days')) || 7;
    const metric = searchParams.get('metric');

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Build query
    const where = {
      patient_id: patientId,
      timestamp: {
        gte: startDate,
        lte: endDate
      }
    };

    if (metric) {
      where.metric_type = metric;
    }

    // Get data
    const data = await prisma.biometric_data.findMany({
      where,
      orderBy: { timestamp: 'asc' }
    });

    // Calculate summaries
    const summaries = calculateMetricSummaries(data);

    return NextResponse.json(
      {
        success: true,
        period: {
          start: startDate.toISOString(),
          end: endDate.toISOString(),
          days
        },
        data: summaries,
        totalRecords: data.length
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Summary calculation error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to calculate summary'
      },
      { status: 500 }
    );
  }
}
