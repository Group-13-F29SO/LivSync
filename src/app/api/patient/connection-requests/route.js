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

    // Get all pending connection requests for the patient
    const requests = await prisma.connection_requests.findMany({
      where: {
        patient_id: patientId,
        status: 'pending',
      },
      include: {
        providers: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
            specialty: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    return NextResponse.json(
      { requests },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching connection requests:', error);
    return NextResponse.json(
      { error: 'An error occurred while fetching connection requests' },
      { status: 500 }
    );
  }
}
