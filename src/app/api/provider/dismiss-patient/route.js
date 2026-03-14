import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const { providerId, patientId } = body;

    // Validation
    if (!providerId || !patientId) {
      return NextResponse.json(
        { error: 'Provider ID and Patient ID are required' },
        { status: 400 }
      );
    }

    // Verify provider exists
    const provider = await prisma.providers.findUnique({
      where: { id: providerId },
    });

    if (!provider) {
      return NextResponse.json(
        { error: 'Provider not found' },
        { status: 404 }
      );
    }

    // Check if there's a revoked connection
    const revokedRequest = await prisma.connection_requests.findFirst({
      where: {
        provider_id: providerId,
        patient_id: patientId,
        status: 'revoked',
      },
    });

    if (!revokedRequest) {
      return NextResponse.json(
        { error: 'No revoked connection found to dismiss' },
        { status: 404 }
      );
    }

    // Delete the revoked connection request to remove from dashboard
    await prisma.connection_requests.delete({
      where: { id: revokedRequest.id },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Patient dismissed successfully',
        data: {
          patientId,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error dismissing patient:', error);
    return NextResponse.json(
      { error: 'Failed to dismiss patient' },
      { status: 500 }
    );
  }
}
