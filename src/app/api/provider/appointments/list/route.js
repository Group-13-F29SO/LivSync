import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export async function GET(request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('livsync_session')?.value;

    if (!sessionCookie) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    let session;
    try {
      session = JSON.parse(sessionCookie);
    } catch {
      return NextResponse.json(
        { message: 'Invalid session' },
        { status: 401 }
      );
    }

    if (session.userType !== 'provider') {
      return NextResponse.json(
        { message: 'Only providers can view appointments' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const startDateStr = searchParams.get('startDate');
    const endDateStr = searchParams.get('endDate');

    let whereClause = {
      provider_id: session.userId,
    };

    if (startDateStr && endDateStr) {
      whereClause.appointment_date = {
        gte: new Date(startDateStr),
        lte: new Date(endDateStr),
      };
    }

    const appointments = await prisma.appointments.findMany({
      where: whereClause,
      include: {
        patients: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
            username: true,
          },
        },
      },
      orderBy: [
        { appointment_date: 'asc' },
        { appointment_time: 'asc' },
      ],
    });

    return NextResponse.json(
      {
        appointments,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return NextResponse.json(
      { message: 'Failed to fetch appointments' },
      { status: 500 }
    );
  }
}
