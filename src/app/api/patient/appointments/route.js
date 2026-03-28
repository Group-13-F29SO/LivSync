import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';

export async function GET(req) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('livsync_session');

    if (!sessionCookie) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let session;
    try {
      session = JSON.parse(sessionCookie.value);
    } catch {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    if (!session.userId || session.userType !== 'patient') {
      return NextResponse.json({ error: 'Forbidden - Patient access required' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status'); // 'upcoming', 'completed', 'all'
    const limit = parseInt(searchParams.get('limit') || '10');

    // Build filter
    const filter = {
      patient_id: session.userId,
    };

    if (status === 'upcoming') {
      filter.appointment_date = {
        gte: new Date(),
      };
    } else if (status === 'completed') {
      filter.status = 'completed';
    }

    // Fetch appointments
    const appointments = await prisma.appointments.findMany({
      where: filter,
      include: {
        providers: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
      },
      orderBy: [{ appointment_date: 'desc' }, { appointment_time: 'desc' }],
      take: limit,
    });

    return NextResponse.json(appointments);
  } catch (error) {
    console.error('Error fetching patient appointments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch appointments' },
      { status: 500 }
    );
  }
}
