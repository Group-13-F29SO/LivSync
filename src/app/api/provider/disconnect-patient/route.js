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

    // Check if there's an existing connection (either accepted connection_request or direct provider_id link)
    const connectionRequest = await prisma.connection_requests.findFirst({
      where: {
        provider_id: providerId,
        patient_id: patientId,
        status: 'accepted',
      },
    });

    if (!connectionRequest) {
      return NextResponse.json(
        { error: 'No active connection found between provider and patient' },
        { status: 404 }
      );
    }

    // Start transaction to ensure both updates succeed
    const result = await prisma.$transaction(async (tx) => {
      // Update connection request status to revoked
      const updatedRequest = await tx.connection_requests.update({
        where: { id: connectionRequest.id },
        data: { status: 'revoked' },
      });

      // Remove provider_id from patient record
      const updatedPatient = await tx.patients.update({
        where: { id: patientId },
        data: {
          provider_id: null,
          provider_consent_status: 'revoked',
        },
      });

      return { updatedRequest, updatedPatient };
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Patient connection revoked successfully',
        data: {
          patientId: result.updatedPatient.id,
          status: result.updatedRequest.status,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error disconnecting patient:', error);
    return NextResponse.json(
      { error: 'Failed to disconnect patient' },
      { status: 500 }
    );
  }
}
