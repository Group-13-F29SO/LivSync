import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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

export async function POST(request, { params }) {
  try {
    const session = verifyAdminSession(request);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: patientId } = params;
    const { date } = await request.json();

    if (!date) {
      return NextResponse.json(
        { error: 'Date is required' },
        { status: 400 }
      );
    }

    // Verify patient exists
    const patient = await prisma.patients.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      );
    }

    // Parse date string to create local midnight (not UTC)
    // date format: "YYYY-MM-DD"
    const [year, month, day] = date.split('-').map(Number);
    const startOfDay = new Date(year, month - 1, day, 0, 0, 0, 0);
    const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999);

    // Delete all biometric data for this patient on the selected date
    const result = await prisma.biometric_data.deleteMany({
      where: {
        patient_id: patientId,
        timestamp: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: `Deleted ${result.count} biometric entries for ${date}`,
      count: result.count,
    });
  } catch (error) {
    console.error('Error deleting biometrics:', error);
    return NextResponse.json(
      { error: 'Failed to delete biometrics', details: error.message },
      { status: 500 }
    );
  }
}
