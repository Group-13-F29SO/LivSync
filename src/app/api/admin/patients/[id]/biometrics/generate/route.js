import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bloodGlucoseGenerator from '@/generators/bloodGlucoseGenerator';
import heartRateGenerator from '@/generators/heartRateGenerator';
import stepsGenerator from '@/generators/stepsGenerator';
import sleepGenerator from '@/generators/sleepGenerator';
import hydrationGenerator from '@/generators/hydrationGenerator';
import caloriesGenerator from '@/generators/caloriesGenerator';

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

    // Parse the date
    const selectedDate = new Date(date);
    const startOfDay = new Date(selectedDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(selectedDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Generate biometric data for all types
    const generators = [
      { type: 'blood_glucose', generator: bloodGlucoseGenerator },
      { type: 'heart_rate', generator: heartRateGenerator },
      { type: 'steps', generator: stepsGenerator },
      { type: 'sleep', generator: sleepGenerator },
      { type: 'hydration', generator: hydrationGenerator },
      { type: 'calories', generator: caloriesGenerator },
    ];

    const generatedData = [];

    for (const { type, generator } of generators) {
      try {
        const data = generator(selectedDate);
        
        if (Array.isArray(data)) {
          for (const entry of data) {
            const created = await prisma.biometric_data.create({
              data: {
                patient_id: patientId,
                metric_type: type,
                value: entry.value || entry,
                timestamp: entry.timestamp || new Date(entry.date || selectedDate),
                source: 'admin_generated',
                is_user_entered: false,
              },
            });
            generatedData.push(created);
          }
        } else if (data) {
          const created = await prisma.biometric_data.create({
            data: {
              patient_id: patientId,
              metric_type: type,
              value: data.value || data,
              timestamp: data.timestamp || selectedDate,
              source: 'admin_generated',
              is_user_entered: false,
            },
          });
          generatedData.push(created);
        }
      } catch (err) {
        console.error(`Error generating ${type}:`, err);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Generated ${generatedData.length} biometric entries for ${date}`,
      count: generatedData.length,
    });
  } catch (error) {
    console.error('Error generating biometrics:', error);
    return NextResponse.json(
      { error: 'Failed to generate biometrics', details: error.message },
      { status: 500 }
    );
  }
}
