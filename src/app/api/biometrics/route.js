/**
 * GET /api/biometrics
 * Retrieve biometric data for authenticated user
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
    const metric = searchParams.get('metric');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit')) || 1000;

    // Build query filters
    const where = {
      patient_id: patientId
    };

    if (metric) {
      where.metric_type = metric;
    }

    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) {
        where.timestamp.gte = new Date(startDate);
      }
      if (endDate) {
        where.timestamp.lte = new Date(endDate);
      }
    }

    // Query biometric data
    const data = await prisma.biometric_data.findMany({
      where,
      orderBy: { timestamp: 'asc' },
      take: Math.min(limit, 10000) // Max 10,000 records
    });

    return NextResponse.json(
      {
        success: true,
        data,
        count: data.length
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Biometrics retrieval error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to retrieve biometric data'
      },
      { status: 500 }
    );
  }
}
