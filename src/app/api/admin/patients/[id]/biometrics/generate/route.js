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

    // Parse date string to create local midnight (not UTC)
    // dateParam format: "YYYY-MM-DD"
    const [year, month, day] = date.split('-').map(Number);
    const selectedDate = new Date(year, month - 1, day, 0, 0, 0, 0);
    const startOfDay = new Date(year, month - 1, day, 0, 0, 0, 0);
    const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999);

    // Get the patient's primary device (most recently synced)
    const device = await prisma.devices.findFirst({
      where: {
        patient_id: patientId,
        is_active: true,
      },
      orderBy: {
        last_sync: 'desc',
      },
    });

    // Use device name as source, fallback to 'admin_generated' if no device
    const dataSource = device ? device.device_name : 'admin_generated';

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
        const generatorInstance = new generator();
        const data = generatorInstance.generate(selectedDate);
        
        if (Array.isArray(data)) {
          for (const entry of data) {
            const created = await prisma.biometric_data.create({
              data: {
                patient_id: patientId,
                metric_type: type,
                value: entry.value ?? entry,
                timestamp: entry.timestamp || new Date(entry.date || selectedDate),
                source: dataSource,
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
              value: data.value ?? data,
              timestamp: data.timestamp || selectedDate,
              source: dataSource,
              is_user_entered: false,
            },
          });
          generatedData.push(created);
        }
      } catch (err) {
        console.error(`Error generating ${type}:`, err);
      }
    }

    // Update patient's last_sync to the end of the generated date
    await prisma.patients.update({
      where: { id: patientId },
      data: {
        last_sync: endOfDay,
      },
    });

    if (device) {
      await prisma.devices.update({
        where: { id: device.id },
        data: {
          last_sync: endOfDay,
        },
      });
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
