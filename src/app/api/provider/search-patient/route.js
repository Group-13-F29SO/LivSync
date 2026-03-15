import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const providerId = searchParams.get('providerId');
    const email = searchParams.get('email');

    // Validation
    if (!providerId || !email) {
      return NextResponse.json(
        { error: 'Provider ID and email are required' },
        { status: 400 }
      );
    }

    // Search for patient by email
    const patient = await prisma.patients.findUnique({
      where: { email },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        provider_id: true,
      },
    });

    if (!patient) {
      return NextResponse.json(
        { patient: null },
        { status: 200 }
      );
    }

    // Check if already connected
    const isConnected = patient.provider_id === providerId;

    // Check if pending request exists
    const hasPendingRequest = await prisma.connection_requests.findFirst({
      where: {
        provider_id: providerId,
        patient_id: patient.id,
        status: 'pending',
      },
    });

    return NextResponse.json(
      {
        patient: {
          id: patient.id,
          firstName: patient.first_name,
          lastName: patient.last_name,
          email: patient.email,
          isConnected,
          hasPendingRequest: !!hasPendingRequest,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error searching patient:', error);
    return NextResponse.json(
      { error: 'An error occurred while searching for the patient' },
      { status: 500 }
    );
  }
}
