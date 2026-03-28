import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');

    // Validation
    if (!patientId) {
      return NextResponse.json(
        { error: 'Patient ID is required' },
        { status: 400 }
      );
    }

    // Get the provider from session to verify access
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('livsync_session');
    
    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    let session;
    try {
      session = JSON.parse(sessionCookie.value);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      );
    }

    const providerId = session.userId;

    // Verify that the provider has access to this patient
    // (patient has accepted connection request)
    const patient = await prisma.patients.findFirst({
      where: {
        id: patientId,
        provider_id: providerId,
      },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        last_sync: true,
        patient_profiles: {
          select: {
            date_of_birth: true,
          },
        },
      },
    });

    if (!patient) {
      return NextResponse.json(
        { error: 'Patient not found or access denied' },
        { status: 404 }
      );
    }

    // Calculate age
    const age = patient.patient_profiles?.date_of_birth 
      ? calculateAge(patient.patient_profiles.date_of_birth)
      : null;

    const lastSync = formatLastSync(patient.last_sync);

    return NextResponse.json({
      success: true,
      patient: {
        id: patient.id,
        firstName: patient.first_name,
        lastName: patient.last_name,
        name: `${patient.first_name} ${patient.last_name}`,
        email: patient.email,
        age,
        status: 'Connected',
        statusColor: 'green',
        lastSync,
      },
    });
  } catch (error) {
    console.error('Error fetching patient details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch patient details' },
      { status: 500 }
    );
  }
}

function calculateAge(dateOfBirth) {
  const today = new Date();
  let age = today.getFullYear() - dateOfBirth.getFullYear();
  const monthDiff = today.getMonth() - dateOfBirth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
    age--;
  }
  
  return age;
}

function formatLastSync(date) {
  if (!date) {
    return null;
  }

  const now = new Date();
  const diffMs = now - new Date(date);
  const diffMins = Math.max(0, Math.floor(diffMs / 60000));

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d`;
}
