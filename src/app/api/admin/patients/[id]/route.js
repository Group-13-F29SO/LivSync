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

export async function GET(request, { params }) {
  try {
    const session = verifyAdminSession(request);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = params;

    // Fetch patient with all related data
    const patient = await prisma.patients.findUnique({
      where: { id },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        username: true,
        email: true,
        profile_picture_url: true,
        provider_id: true,
        provider_consent_status: true,
        created_at: true,
        updated_at: true,
        patient_profiles: {
          select: {
            date_of_birth: true,
            height_cm: true,
            weight_kg: true,
            biological_sex: true,
            created_at: true,
            updated_at: true,
          },
        },
        biometric_data: {
          select: {
            id: true,
            metric_type: true,
            value: true,
            timestamp: true,
            source: true,
          },
          orderBy: {
            timestamp: 'desc',
          },
          take: 50, // Get last 50 biometric entries
        },
        goals: {
          select: {
            id: true,
            metric_type: true,
            target_value: true,
            frequency: true,
            is_active: true,
            created_at: true,
          },
          orderBy: {
            created_at: 'desc',
          },
        },
        devices: {
          select: {
            id: true,
            device_name: true,
            device_type: true,
            device_model: true,
            is_active: true,
            battery_level: true,
            last_sync: true,
            paired_at: true,
            created_at: true,
          },
          orderBy: {
            created_at: 'desc',
          },
        },
        user_achievements: {
          select: {
            achievement_id: true,
            earned_at: true,
            achievements: {
              select: {
                id: true,
                name: true,
                description: true,
                icon_url: true,
              },
            },
          },
          orderBy: {
            earned_at: 'desc',
          },
        },
      },
    });

    if (!patient) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      );
    }

    // Fetch provider information if assigned
    const provider = patient.provider_id
      ? await prisma.providers.findUnique({
          where: { id: patient.provider_id },
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
            specialty: true,
            is_verified: true,
          },
        })
      : null;

    // Calculate statistics
    const biometricMetrics = patient.biometric_data.reduce((acc, entry) => {
      if (!acc[entry.metric_type]) {
        acc[entry.metric_type] = [];
      }
      acc[entry.metric_type].push({
        value: parseFloat(entry.value),
        timestamp: entry.timestamp,
      });
      return acc;
    }, {});

    const stats = Object.entries(biometricMetrics).reduce((acc, [metric, data]) => {
      if (data.length > 0) {
        const values = data.map(d => d.value);
        acc[metric] = {
          latest: values[0],
          average: values.reduce((a, b) => a + b, 0) / values.length,
          min: Math.min(...values),
          max: Math.max(...values),
          count: values.length,
        };
      }
      return acc;
    }, {});

    return NextResponse.json({
      patient: {
        id: patient.id,
        firstName: patient.first_name,
        lastName: patient.last_name,
        username: patient.username,
        email: patient.email,
        profilePictureUrl: patient.profile_picture_url,
        providerId: patient.provider_id,
        provider,
        providerConsentStatus: patient.provider_consent_status,
        createdAt: patient.created_at,
        updatedAt: patient.updated_at,
        profile: patient.patient_profiles
          ? {
              dateOfBirth: patient.patient_profiles.date_of_birth,
              heightCm: patient.patient_profiles.height_cm,
              weightKg: parseFloat(patient.patient_profiles.weight_kg) || null,
              biologicalSex: patient.patient_profiles.biological_sex,
              createdAt: patient.patient_profiles.created_at,
              updatedAt: patient.patient_profiles.updated_at,
            }
          : null,
        biometricData: patient.biometric_data.map(b => ({
          id: b.id,
          metricType: b.metric_type,
          value: parseFloat(b.value),
          timestamp: b.timestamp,
          source: b.source,
        })),
        goals: patient.goals.map(g => ({
          id: g.id,
          metricType: g.metric_type,
          targetValue: g.target_value,
          frequency: g.frequency,
          isActive: g.is_active,
          createdAt: g.created_at,
        })),
        devices: patient.devices.map(d => ({
          id: d.id,
          deviceName: d.device_name,
          deviceType: d.device_type,
          deviceModel: d.device_model,
          isActive: d.is_active,
          batteryLevel: d.battery_level,
          lastSync: d.last_sync,
          pairedAt: d.paired_at,
          createdAt: d.created_at,
        })),
        achievements: patient.user_achievements.map(ua => ({
          id: ua.achievement_id,
          name: ua.achievements.name,
          description: ua.achievements.description,
          iconUrl: ua.achievements.icon_url,
          earnedAt: ua.earned_at,
        })),
        statistics: stats,
      },
    });
  } catch (error) {
    console.error('Error fetching patient details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch patient details', details: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const session = verifyAdminSession(request);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = params;
    const body = await request.json();

    // Check if patient exists
    const existingPatient = await prisma.patients.findUnique({
      where: { id },
    });

    if (!existingPatient) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      );
    }

    // Update patient data (only allow updating non-sensitive fields from admin)
    const updateData = {};
    if (body.first_name) updateData.first_name = body.first_name;
    if (body.last_name) updateData.last_name = body.last_name;
    if (body.provider_id !== undefined) updateData.provider_id = body.provider_id;
    if (body.provider_consent_status) updateData.provider_consent_status = body.provider_consent_status;

    const updatedPatient = await prisma.patients.update({
      where: { id },
      data: {
        ...updateData,
        updated_at: new Date(),
      },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        provider_id: true,
        provider_consent_status: true,
        updated_at: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Patient updated successfully',
      patient: {
        id: updatedPatient.id,
        firstName: updatedPatient.first_name,
        lastName: updatedPatient.last_name,
        email: updatedPatient.email,
        providerId: updatedPatient.provider_id,
        providerConsentStatus: updatedPatient.provider_consent_status,
        updatedAt: updatedPatient.updated_at,
      },
    });
  } catch (error) {
    console.error('Error updating patient:', error);
    return NextResponse.json(
      { error: 'Failed to update patient', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = verifyAdminSession(request);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = params;

    // Delete patient (cascades to related data)
    await prisma.patients.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Patient deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting patient:', error);
    return NextResponse.json(
      { error: 'Failed to delete patient', details: error.message },
      { status: 500 }
    );
  }
}
