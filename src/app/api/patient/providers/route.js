import { PrismaClient } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');

    if (!patientId) {
      return NextResponse.json(
        { error: 'patientId is required' },
        { status: 400 }
      );
    }

    // Get connected providers (through accepted connection requests)
    const connectedProviders = await prisma.providers.findMany({
      where: {
        connection_requests: {
          some: {
            patient_id: patientId,
            status: 'accepted', // Only accepted connections
          },
        },
      },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        specialty: true,
        workplace_name: true,
        work_phone: true,
        is_verified: true,
      },
      orderBy: {
        first_name: 'asc',
      },
    });

    return NextResponse.json({
      providers: connectedProviders,
      count: connectedProviders.length,
    });
  } catch (error) {
    console.error('Error fetching connected providers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch providers' },
      { status: 500 }
    );
  }
}
