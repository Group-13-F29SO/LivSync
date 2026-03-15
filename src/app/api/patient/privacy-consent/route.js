import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

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

    // Get patient's current privacy consent status
    const patient = await prisma.patients.findUnique({
      where: { id: patientId },
      select: {
        id: true,
        provider_consent_status: true,
        provider_id: true,
      },
    });

    if (!patient) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        patientId: patient.id,
        shareDataWithProviders: patient.provider_consent_status === 'accepted',
        currentStatus: patient.provider_consent_status,
        hasActiveProvider: !!patient.provider_id,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching privacy consent:', error);
    return NextResponse.json(
      { error: 'Failed to fetch privacy consent' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { patientId, shareData } = body;

    // Validation
    if (!patientId || shareData === undefined) {
      return NextResponse.json(
        { error: 'Patient ID and shareData status are required' },
        { status: 400 }
      );
    }

    // Get patient's current state
    const patient = await prisma.patients.findUnique({
      where: { id: patientId },
      select: {
        id: true,
        provider_id: true,
        provider_consent_status: true,
      },
    });

    if (!patient) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      );
    }

    let result;

    if (shareData) {
      // Toggling ON - allow data sharing with providers
      result = await prisma.patients.update({
        where: { id: patientId },
        data: {
          provider_consent_status: 'accepted',
        },
        select: {
          id: true,
          provider_consent_status: true,
          provider_id: true,
        },
      });
    } else {
      // Toggling OFF - revoke all provider connections
      // Use transaction to ensure consistency
      result = await prisma.$transaction(async (tx) => {
        // If there's an active provider connection, revoke it
        if (patient.provider_id) {
          // Find the accepted connection request
          const acceptedRequest = await tx.connection_requests.findFirst({
            where: {
              patient_id: patientId,
              status: 'accepted',
            },
          });

          // Update the connection request to revoked
          if (acceptedRequest) {
            await tx.connection_requests.update({
              where: { id: acceptedRequest.id },
              data: { status: 'revoked' },
            });
          }
        }

        // Update patient to deny consent and clear provider
        const updatedPatient = await tx.patients.update({
          where: { id: patientId },
          data: {
            provider_id: null,
            provider_consent_status: 'denied',
          },
          select: {
            id: true,
            provider_consent_status: true,
            provider_id: true,
          },
        });

        return updatedPatient;
      });
    }

    return NextResponse.json(
      {
        success: true,
        message: `Data sharing ${shareData ? 'enabled' : 'disabled'} successfully`,
        data: {
          patientId: result.id,
          shareDataWithProviders: result.provider_consent_status === 'accepted',
          currentStatus: result.provider_consent_status,
          hasActiveProvider: !!result.provider_id,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating privacy consent:', error);
    return NextResponse.json(
      { error: 'Failed to update privacy consent' },
      { status: 500 }
    );
  }
}
