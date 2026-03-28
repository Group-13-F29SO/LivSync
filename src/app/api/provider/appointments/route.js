import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { queueAppointmentReminders } from '@/services/appointmentReminderService';

export async function POST(request) {
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
        { message: 'Only providers can schedule appointments' },
        { status: 403 }
      );
    }

    const { patientId, appointmentDate, appointmentTime, notes } = await request.json();

    if (!patientId || !appointmentDate || !appointmentTime) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate that patient is connected to provider
    const patient = await prisma.patients.findUnique({
      where: { id: patientId },
    });

    if (!patient || patient.provider_id !== session.userId) {
      return NextResponse.json(
        { message: 'Patient not connected to this provider' },
        { status: 403 }
      );
    }

    // Validate appointment time format (HH:MM)
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(appointmentTime)) {
      return NextResponse.json(
        { message: 'Invalid time format' },
        { status: 400 }
      );
    }

    // Check if slot is already booked
    const existingAppointment = await prisma.appointments.findFirst({
      where: {
        provider_id: session.userId,
        appointment_date: new Date(appointmentDate),
        appointment_time: appointmentTime,
      },
    });

    if (existingAppointment) {
      return NextResponse.json(
        { message: 'Time slot already booked' },
        { status: 409 }
      );
    }

    const appointment = await prisma.appointments.create({
      data: {
        provider_id: session.userId,
        patient_id: patientId,
        appointment_date: new Date(appointmentDate),
        appointment_time: appointmentTime,
        notes: notes || null,
        status: 'scheduled',
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
        providers: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
          },
        },
      },
    });

    // Queue reminder notifications for the scheduler
    try {
      await queueAppointmentReminders(appointment);
    } catch (reminderError) {
      console.error('Error creating reminder notifications:', reminderError);
      // Don't fail the appointment creation if reminders fail
    }

    return NextResponse.json(
      {
        message: 'Appointment scheduled successfully',
        appointment,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error scheduling appointment:', error);
    return NextResponse.json(
      { message: 'Failed to schedule appointment' },
      { status: 500 }
    );
  }
}
