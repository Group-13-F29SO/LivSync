import { NextResponse } from 'next/server';
import { processDueAppointmentReminders } from '@/services/appointmentReminderService';

/**
 * Scheduler endpoint for generating appointment reminders
 * This endpoint should be called by a cron job or scheduled task
 * 
 * Usage: GET /api/scheduler/appointment-reminders
 * Optional auth: Pass ?secret=APPOINTMENT_REMINDER_SECRET in header or query
 */

export async function GET(req) {
  try {
    // Optional: Add a secret for security if you want to restrict scheduler access
    const secret = process.env.APPOINTMENT_REMINDER_SECRET;
    const providedSecret = req.headers.get('x-scheduler-secret') || 
                          new URL(req.url).searchParams.get('secret');

    if (secret && providedSecret !== secret) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid scheduler secret' },
        { status: 401 }
      );
    }

    const result = await processDueAppointmentReminders();

    return NextResponse.json(
      {
        success: true,
        message: 'Appointment reminders generated successfully',
        createdCount: result.createdCount,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Scheduler error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate appointment reminders',
        message: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * Alternative: POST endpoint for testing
 */
export async function POST(req) {
  return GET(req);
}
