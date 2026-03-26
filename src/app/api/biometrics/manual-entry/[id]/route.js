import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

/**
 * DELETE /api/biometrics/manual-entry/[id]
 * Delete a manual entry (reverts to synced data)
 */
export async function DELETE(req, { params }) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('livsync_session');

    if (!sessionCookie) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    let session;
    try {
      session = JSON.parse(sessionCookie.value);
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid session' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const patientId = session.userId;
    const entryId = params.id;

    if (!entryId) {
      return new Response(
        JSON.stringify({ error: 'Entry ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verify ownership and that it's a user-entered entry
    const entry = await prisma.biometric_data.findFirst({
      where: {
        id: BigInt(entryId),
        patient_id: patientId,
        is_user_entered: true,
      },
    });

    if (!entry) {
      return new Response(
        JSON.stringify({ error: 'Entry not found or not authorized' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Delete the manual entry
    await prisma.biometric_data.delete({
      where: { id: BigInt(entryId) },
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Manual entry deleted successfully. Synced data will now be visible.',
        data: {
          id: entry.id,
          metric_type: entry.metric_type,
          timestamp: entry.timestamp,
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error deleting manual entry:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * PATCH /api/biometrics/manual-entry/[id]
 * Update a manual entry
 * 
 * Body (for point metrics):
 * {
 *   value: number
 * }
 * 
 * Body (for sleep):
 * {
 *   sleep_start_time: string (ISO datetime)
 *   sleep_end_time: string (ISO datetime)
 * }
 */
export async function PATCH(req, { params }) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('livsync_session');

    if (!sessionCookie) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    let session;
    try {
      session = JSON.parse(sessionCookie.value);
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid session' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const patientId = session.userId;
    const entryId = params.id;

    if (!entryId) {
      return new Response(
        JSON.stringify({ error: 'Entry ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();

    // Verify ownership and that it's a user-entered entry
    const entry = await prisma.biometric_data.findFirst({
      where: {
        id: BigInt(entryId),
        patient_id: patientId,
        is_user_entered: true,
      },
    });

    if (!entry) {
      return new Response(
        JSON.stringify({ error: 'Entry not found or not authorized' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Handle sleep entry updates
    if (entry.metric_type === 'sleep') {
      const { sleep_start_time, sleep_end_time } = body;

      if (!sleep_start_time || !sleep_end_time) {
        return new Response(
          JSON.stringify({ error: 'Sleep updates require sleep_start_time and sleep_end_time' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const startTime = new Date(sleep_start_time);
      const endTime = new Date(sleep_end_time);

      if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
        return new Response(
          JSON.stringify({ error: 'Invalid sleep time format' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      if (endTime <= startTime) {
        return new Response(
          JSON.stringify({ error: 'End time must be after start time' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const durationMs = endTime.getTime() - startTime.getTime();
      const durationHours = durationMs / (1000 * 60 * 60);

      if (durationHours < 0.5 || durationHours > 14) {
        return new Response(
          JSON.stringify({ error: 'Sleep duration must be between 0.5 and 14 hours' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const updated = await prisma.biometric_data.update({
        where: { id: BigInt(entryId) },
        data: {
          value: Math.round(durationHours * 100) / 100,
        },
      });

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Manual sleep entry updated successfully',
          data: {
            id: updated.id,
            metric_type: updated.metric_type,
            value: parseFloat(updated.value),
            timestamp: updated.timestamp,
            duration_hours: Math.round(durationHours * 100) / 100,
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Handle point-in-time metric updates
    const { value } = body;

    if (typeof value !== 'number' || value < 0) {
      return new Response(
        JSON.stringify({ error: 'Value must be a non-negative number' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const updated = await prisma.biometric_data.update({
      where: { id: BigInt(entryId) },
      data: {
        value: Math.round(value * 100) / 100,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Manual entry updated successfully',
        data: {
          id: updated.id,
          metric_type: updated.metric_type,
          value: parseFloat(updated.value),
          timestamp: updated.timestamp,
        },
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error updating manual entry:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
