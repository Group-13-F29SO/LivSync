import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const { providerId, email } = body;

    // Validation
    if (!providerId || !email) {
      return NextResponse.json(
        { error: 'Provider ID and email are required' },
        { status: 400 }
      );
    }

    // Find patient by email
    const patient = await prisma.patients.findUnique({
      where: { email },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        provider_id: true,
        provider_consent_status: true,
      },
    });

    if (!patient) {
      return NextResponse.json(
        { error: 'No patient found with this email' },
        { status: 404 }
      );
    }

    // Check if patient is already connected to this provider
    if (patient.provider_id === providerId) {
      return NextResponse.json(
        { error: 'Patient is already connected to you' },
        { status: 400 }
      );
    }

    // Check if a pending request already exists
    const existingRequest = await prisma.connection_requests.findFirst({
      where: {
        provider_id: providerId,
        patient_id: patient.id,
        status: 'pending',
      },
    });

    if (existingRequest) {
      return NextResponse.json(
        { error: 'Connection request already sent to this patient' },
        { status: 400 }
      );
    }

    // Create connection request
    const connectionRequest = await prisma.connection_requests.create({
      data: {
        provider_id: providerId,
        patient_id: patient.id,
        status: 'pending',
      },
    });

    return NextResponse.json(
      {
        message: 'Connection request sent successfully',
        request: connectionRequest,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error sending connection request:', error);
    return NextResponse.json(
      { error: 'An error occurred while sending the connection request' },
      { status: 500 }
    );
  }
}
