import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

// Helper function to verify admin session
function verifyAdminSession(request) {
  try {
    const sessionCookie = request.cookies.get('livsync_admin_session');
    
    if (!sessionCookie) {
      return null;
    }

    const session = JSON.parse(sessionCookie.value);
    
    if (session.role !== 'admin') {
      return null;
    }

    return session;
  } catch (error) {
    return null;
  }
}

export async function POST(request) {
  try {
    const session = verifyAdminSession(request);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { patientId, date } = await request.json();

    if (!patientId || !date) {
      return NextResponse.json(
        { error: 'Missing required fields: patientId and date' },
        { status: 400 }
      );
    }

    // Validate patient exists
    const patient = await prisma.patients.findUnique({
      where: { id: patientId }
    });

    if (!patient) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      );
    }

    // Parse and normalize the date
    let targetDate = new Date(date);
    if (isNaN(targetDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      );
    }
    targetDate.setHours(0, 0, 0, 0);

    // Delete all biometric data for this date
    const dateStart = new Date(targetDate);
    dateStart.setHours(0, 0, 0, 0);
    const dateEnd = new Date(targetDate);
    dateEnd.setHours(23, 59, 59, 999);

    const result = await prisma.biometric_data.deleteMany({
      where: {
        patient_id: patientId,
        timestamp: {
          gte: dateStart,
          lt: dateEnd
        }
      }
    });

    return NextResponse.json({
      success: true,
      deleted_count: result.count,
      date: targetDate.toISOString().split('T')[0]
    });
  } catch (error) {
    console.error('Error deleting biometric data:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete biometric data' },
      { status: 500 }
    );
  }
}
