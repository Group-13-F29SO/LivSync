/**
 * GET /api/patient/last-sync - Get the last sync time for authenticated patient
 */

import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

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

/**
 * GET - Retrieve the last sync time for the authenticated patient
 */
export async function GET(request) {
  try {
    const session = getAuthenticatedUser(request);
    
    if (!session || !session.userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const patientId = session.userId;

    // Fetch patient's last sync time
    const patient = await prisma.patients.findUnique({
      where: { id: patientId },
      select: {
        last_sync: true
      }
    });

    if (!patient) {
      return NextResponse.json(
        { success: false, error: 'Patient not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        lastSync: patient.last_sync
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error fetching last sync time:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch last sync time'
      },
      { status: 500 }
    );
  }
}
