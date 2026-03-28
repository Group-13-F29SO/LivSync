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
        { message: 'Only providers can view appointment slots' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get('date');

    if (!dateStr) {
      return NextResponse.json(
        { message: 'Date parameter is required' },
        { status: 400 }
      );
    }

    const appointmentDate = new Date(dateStr);
    const dayOfWeek = appointmentDate.getDay();

    // Check if it's weekend (0 = Sunday, 6 = Saturday)
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return NextResponse.json(
        {
          message: 'Appointments cannot be scheduled on weekends',
          availableSlots: [],
        },
        { status: 200 }
      );
    }

    // Get all booked appointments for this date
    const bookedAppointments = await prisma.appointments.findMany({
      where: {
        provider_id: session.userId,
        appointment_date: appointmentDate,
      },
      select: {
        appointment_time: true,
      },
    });

    const bookedTimes = bookedAppointments.map((app) => app.appointment_time);

    // Generate available slots: 9am-5pm, every 30 minutes, excluding 12:30pm-1pm lunch
    const availableSlots = [];
    for (let hour = 9; hour < 17; hour++) {
      for (let minutes = 0; minutes < 60; minutes += 30) {
        const time = `${String(hour).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;

        // Skip lunch break (12:30pm-1pm)
        if (hour === 12 && minutes === 30) {
          continue;
        }

        if (!bookedTimes.includes(time)) {
          availableSlots.push(time);
        }
      }
    }

    return NextResponse.json(
      {
        date: dateStr,
        availableSlots,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching available slots:', error);
    return NextResponse.json(
      { message: 'Failed to fetch available slots' },
      { status: 500 }
    );
  }
}
