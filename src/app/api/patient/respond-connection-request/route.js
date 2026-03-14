import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const { requestId, action } = body;

    // Validation
    if (!requestId || !['accept', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Request ID and valid action are required' },
        { status: 400 }
      );
    }

    // Get the connection request
    const connectionRequest = await prisma.connection_requests.findUnique({
      where: { id: requestId },
    });

    if (!connectionRequest) {
      return NextResponse.json(
        { error: 'Connection request not found' },
        { status: 404 }
      );
    }

    if (connectionRequest.status !== 'pending') {
      return NextResponse.json(
        { error: 'This request has already been processed' },
        { status: 400 }
      );
    }

    if (action === 'accept') {
      // Check if patient has consented to share data with providers
      const patient = await prisma.patients.findUnique({
        where: { id: connectionRequest.patient_id },
        select: {
          provider_consent_status: true,
        },
      });

      if (patient?.provider_consent_status === 'denied') {
        return NextResponse.json(
          { error: 'Patient has disabled data sharing with healthcare providers' },
          { status: 403 }
        );
      }

      // Update the connection request to accepted
      const updatedRequest = await prisma.connection_requests.update({
        where: { id: requestId },
        data: { status: 'accepted' },
      });

      // Update the patient to link with the provider
      await prisma.patients.update({
        where: { id: connectionRequest.patient_id },
        data: {
          provider_id: connectionRequest.provider_id,
          provider_consent_status: 'accepted',
        },
      });

      return NextResponse.json(
        {
          message: 'Connection request accepted successfully',
          request: updatedRequest,
        },
        { status: 200 }
      );
    } else {
      // Reject - just update status
      const updatedRequest = await prisma.connection_requests.update({
        where: { id: requestId },
        data: { status: 'rejected' },
      });

      return NextResponse.json(
        {
          message: 'Connection request rejected',
          request: updatedRequest,
        },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error('Error handling connection request:', error);
    return NextResponse.json(
      { error: 'An error occurred while processing the connection request' },
      { status: 500 }
    );
  }
}
