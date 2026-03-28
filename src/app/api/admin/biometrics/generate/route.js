import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import BiometricDataGenerator from '@/services/biometricGenerator';

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

    // Check if data already exists for this date
    const dateStart = new Date(targetDate);
    dateStart.setHours(0, 0, 0, 0);
    const dateEnd = new Date(targetDate);
    dateEnd.setHours(23, 59, 59, 999);

    const existingData = await prisma.biometric_data.findFirst({
      where: {
        patient_id: patientId,
        timestamp: {
          gte: dateStart,
          lt: dateEnd
        }
      }
    });

    if (existingData) {
      return NextResponse.json(
        { error: 'Data already exists for this date. Delete existing data first.' },
        { status: 409 }
      );
    }

    // Generate biometric data using the service
    const generator = new BiometricDataGenerator(prisma);
    const result = await generator.generate(patientId, targetDate, 'admin-test');

    return NextResponse.json({
      success: true,
      data_points_generated: result.data_points_generated,
      date: result.date,
      breakdown: result.breakdown
    });
  } catch (error) {
    console.error('Error generating biometric data:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate biometric data' },
      { status: 500 }
    );
  }
}
