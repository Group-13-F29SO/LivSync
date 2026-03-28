import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export async function DELETE(request, { params }) {
  try {
    const { id } = params;
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
        { message: 'Only providers can delete appointments' },
        { status: 403 }
      );
    }

    // Verify appointment belongs to this provider
    const appointment = await prisma.appointments.findUnique({
      where: { id },
    });

    if (!appointment) {
      return NextResponse.json(
        { message: 'Appointment not found' },
        { status: 404 }
      );
    }

    if (appointment.provider_id !== session.userId) {
      return NextResponse.json(
        { message: 'You can only delete your own appointments' },
        { status: 403 }
      );
    }

    // Delete the appointment and cascade delete related reminders
    await prisma.appointments.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: 'Appointment cancelled successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting appointment:', error);
    return NextResponse.json(
      { message: 'Failed to cancel appointment' },
      { status: 500 }
    );
  }
}

export async function PATCH(request, { params }) {
  try {
    const { id } = params;
    const { status } = await request.json();
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
        { message: 'Only providers can update appointments' },
        { status: 403 }
      );
    }

    // Verify appointment belongs to this provider
    const appointment = await prisma.appointments.findUnique({
      where: { id },
    });

    if (!appointment) {
      return NextResponse.json(
        { message: 'Appointment not found' },
        { status: 404 }
      );
    }

    if (appointment.provider_id !== session.userId) {
      return NextResponse.json(
        { message: 'You can only update your own appointments' },
        { status: 403 }
      );
    }

    // Update appointment status
    const updatedAppointment = await prisma.appointments.update({
      where: { id },
      data: {
        status,
        updated_at: new Date(),
      },
      include: {
        patients: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(
      { message: 'Appointment updated successfully', appointment: updatedAppointment },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating appointment:', error);
    return NextResponse.json(
      { message: 'Failed to update appointment' },
      { status: 500 }
    );
  }
}
