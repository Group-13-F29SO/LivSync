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
    // Try to verify session, but allow access for now (development)
    const sessionCookie = request.cookies.get('livsync_admin_session');
    const session = sessionCookie 
      ? (() => {
          try {
            const parsed = JSON.parse(sessionCookie.value);
            return parsed.role === 'admin' ? parsed : null;
          } catch (e) {
            return null;
          }
        })()
      : null;

    // For development, we can proceed without session check
    // In production, uncomment the line below
    // if (!session) {
    //   return NextResponse.json(
    //     { error: 'Unauthorized' },
    //     { status: 401 }
    //   );
    // }

    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: 'Patient ID is required' },
        { status: 400 }
      );
    }

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
        last_sync: true,
        patient_profiles: {
          select: {
            date_of_birth: true,
            height_cm: true,
            weight_kg: true,
            biological_sex: true,
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
          take: 50,
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

    // Return patient data in a clean format
    return NextResponse.json({
      patient: {
        id: patient.id,
        firstName: patient.first_name,
        lastName: patient.last_name,
        username: patient.username,
        email: patient.email,
        profilePictureUrl: patient.profile_picture_url,
        providerId: patient.provider_id,
        providerConsentStatus: patient.provider_consent_status,
        dateOfBirth: patient.patient_profiles?.date_of_birth,
        gender: patient.patient_profiles?.biological_sex,
        createdAt: patient.created_at,
        updatedAt: patient.updated_at,
        lastSync: patient.last_sync,
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
