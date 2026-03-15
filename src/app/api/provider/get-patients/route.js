import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const providerId = searchParams.get('providerId');

    // Validation
    if (!providerId) {
      return NextResponse.json(
        { error: 'Provider ID is required' },
        { status: 400 }
      );
    }

    // Get all patients related to this provider
    // This includes:
    // 1. Active patients (provider_id matches)
    // 2. Pending connection requests
    // 3. Revoked patients (those who previously had approved connection)

    // Get active and revoked patients (by provider_id)
    const connectedPatients = await prisma.patients.findMany({
      where: {
        provider_id: providerId,
      },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        created_at: true,
        patient_profiles: {
          select: {
            date_of_birth: true,
          },
        },
        biometric_data: {
          orderBy: {
            timestamp: 'desc',
          },
          take: 1,
          select: {
            timestamp: true,
            metric_type: true,
            value: true,
          },
        },
      },
    });

    // Get pending connection requests
    const pendingRequests = await prisma.connection_requests.findMany({
      where: {
        provider_id: providerId,
        status: 'pending',
      },
      select: {
        patient_id: true,
        created_at: true,
        patients: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
            created_at: true,
            patient_profiles: {
              select: {
                date_of_birth: true,
              },
            },
            biometric_data: {
              orderBy: {
                timestamp: 'desc',
              },
              take: 1,
              select: {
                timestamp: true,
                metric_type: true,
                value: true,
              },
            },
          },
        },
      },
    });

    // Get revoked connection requests
    const revokedRequests = await prisma.connection_requests.findMany({
      where: {
        provider_id: providerId,
        status: 'revoked',
      },
      select: {
        patient_id: true,
        created_at: true,
        updated_at: true,
        patients: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
            created_at: true,
            patient_profiles: {
              select: {
                date_of_birth: true,
              },
            },
            biometric_data: {
              orderBy: {
                timestamp: 'desc',
              },
              take: 1,
              select: {
                timestamp: true,
                metric_type: true,
                value: true,
              },
            },
          },
        },
      },
    });

    // Format connected patients
    const formattedConnected = connectedPatients.map(patient => ({
      id: patient.id,
      firstName: patient.first_name,
      lastName: patient.last_name,
      name: `${patient.first_name} ${patient.last_name}`,
      email: patient.email,
      age: patient.patient_profiles?.date_of_birth ? calculateAge(patient.patient_profiles.date_of_birth) : null,
      status: 'Active',
      connectionStatus: 'approved',
      lastSync: patient.biometric_data.length > 0 ? getMinutesAgo(patient.biometric_data[0].timestamp) : null,
      statusColor: 'green',
      alert: null,
      createdAt: patient.created_at,
    }));

    // Format pending patients
    const formattedPending = pendingRequests.map(request => ({
      id: request.patients.id,
      firstName: request.patients.first_name,
      lastName: request.patients.last_name,
      name: `${request.patients.first_name} ${request.patients.last_name}`,
      email: request.patients.email,
      age: request.patients.patient_profiles?.date_of_birth ? calculateAge(request.patients.patient_profiles.date_of_birth) : null,
      status: 'Pending',
      connectionStatus: 'pending',
      lastSync: request.patients.biometric_data.length > 0 ? getMinutesAgo(request.patients.biometric_data[0].timestamp) : null,
      statusColor: 'orange',
      alert: null,
      createdAt: request.patients.created_at,
      requestCreatedAt: request.created_at,
    }));

    // Format revoked patients
    const formattedRevoked = revokedRequests.map(request => ({
      id: request.patients.id,
      firstName: request.patients.first_name,
      lastName: request.patients.last_name,
      name: `${request.patients.first_name} ${request.patients.last_name}`,
      email: request.patients.email,
      age: request.patients.patient_profiles?.date_of_birth ? calculateAge(request.patients.patient_profiles.date_of_birth) : null,
      status: 'Revoked',
      connectionStatus: 'revoked',
      lastSync: request.patients.biometric_data.length > 0 ? getMinutesAgo(request.patients.biometric_data[0].timestamp) : null,
      statusColor: 'red',
      alert: null,
      createdAt: request.patients.created_at,
      requestCreatedAt: request.created_at,
      revokedAt: request.updated_at,
    }));

    // Combine all patients
    const allPatients = [...formattedConnected, ...formattedPending, ...formattedRevoked];

    return NextResponse.json(
      {
        patients: allPatients,
        count: {
          total: allPatients.length,
          active: formattedConnected.length,
          pending: formattedPending.length,
          revoked: formattedRevoked.length,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching provider patients:', error);
    return NextResponse.json(
      { error: 'Failed to fetch patients' },
      { status: 500 }
    );
  }
}

// Helper function to calculate age from date of birth
function calculateAge(dateOfBirth) {
  const today = new Date();
  let age = today.getFullYear() - dateOfBirth.getFullYear();
  const monthDiff = today.getMonth() - dateOfBirth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
    age--;
  }
  
  return age;
}

// Helper function to calculate minutes ago
function getMinutesAgo(timestamp) {
  const now = new Date();
  const diff = now - new Date(timestamp);
  const minutes = Math.floor(diff / (1000 * 60));
  // Return absolute value if calculation is negative (timezone or clock issues)
  return Math.max(0, minutes);
}
