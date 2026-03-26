import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

/**
 * POST /api/biometrics/manual-entry
 * Submit a manual metric reading
 * 
 * Body:
 * {
 *   metric_type: 'blood_glucose' | 'heart_rate' | 'sleep' | 'calories' | 'hydration' | 'steps'
 *   value: number (for point-in-time metrics like glucose, heart rate)
 *   timestamp: string (ISO datetime, must be 5-min aligned for point metrics)
 *   
 *   // For sleep specifically:
 *   sleep_start_time: string (ISO datetime, optional)
 *   sleep_end_time: string (ISO datetime, optional)
 *   // If sleep times provided, duration is calculated and value is ignored
 * }
 */
export async function POST(req) {
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
    const body = await req.json();

    const { metric_type, value, timestamp, sleep_start_time, sleep_end_time } = body;

    // Validation
    if (!metric_type || !['blood_glucose', 'heart_rate', 'sleep', 'calories', 'hydration', 'steps'].includes(metric_type)) {
      return new Response(
        JSON.stringify({ error: 'Invalid metric_type' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Handle sleep entries
    if (metric_type === 'sleep') {
      if (!sleep_start_time || !sleep_end_time) {
        return new Response(
          JSON.stringify({ error: 'Sleep entries require sleep_start_time and sleep_end_time' }),
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

      // Calculate duration in hours
      const durationMs = endTime.getTime() - startTime.getTime();
      const durationHours = durationMs / (1000 * 60 * 60);

      if (durationHours < 0.5 || durationHours > 14) {
        return new Response(
          JSON.stringify({ error: 'Sleep duration must be between 0.5 and 14 hours' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // For sleep, store a single entry at midnight of that day with the calculated duration
      const sleepDate = new Date(startTime);
      sleepDate.setHours(0, 0, 0, 0);

      // Check if user already has a manual entry for this date
      const existingEntry = await prisma.biometric_data.findFirst({
        where: {
          patient_id: patientId,
          metric_type: 'sleep',
          is_user_entered: true,
          timestamp: {
            gte: sleepDate,
            lt: new Date(sleepDate.getTime() + 86400000), // Next day
          },
        },
      });

      let result;
      if (existingEntry) {
        // Update existing manual sleep entry
        result = await prisma.biometric_data.update({
          where: { id: existingEntry.id },
          data: {
            value: Math.round(durationHours * 100) / 100, // Round to 2 decimals
            timestamp: sleepDate,
            source: 'manual',
            is_user_entered: true,
          },
        });
      } else {
        // Create new manual sleep entry
        result = await prisma.biometric_data.create({
          data: {
            patient_id: patientId,
            metric_type: 'sleep',
            value: Math.round(durationHours * 100) / 100,
            timestamp: sleepDate,
            source: 'manual',
            is_user_entered: true,
          },
        });
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Manual sleep entry recorded successfully',
          data: {
            id: result.id,
            metric_type: result.metric_type,
            value: parseFloat(result.value),
            timestamp: result.timestamp,
            sleep_start_time: startTime,
            sleep_end_time: endTime,
            duration_hours: durationHours,
          },
        }),
        { status: 201, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Handle point-in-time metrics (glucose, heart_rate, etc.)
    if (!timestamp) {
      return new Response(
        JSON.stringify({ error: 'Timestamp is required for this metric type' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const entryTime = new Date(timestamp);
    if (isNaN(entryTime.getTime())) {
      return new Response(
        JSON.stringify({ error: 'Invalid timestamp format' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check 5-minute alignment: minutes should be 0, 5, 10, 15, 20, etc.
    const minutes = entryTime.getMinutes();
    const seconds = entryTime.getSeconds();
    const milliseconds = entryTime.getMilliseconds();

    if (minutes % 5 !== 0 || seconds !== 0 || milliseconds !== 0) {
      return new Response(
        JSON.stringify({
          error: 'Timestamp must be aligned to 5-minute intervals (00, 05, 10, 15, etc. seconds)',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check value is valid
    if (typeof value !== 'number' || value < 0) {
      return new Response(
        JSON.stringify({ error: 'Value must be a non-negative number' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check that entry is not in the future and not more than 30 days old
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    if (entryTime > now) {
      return new Response(
        JSON.stringify({ error: 'Cannot enter metrics for future times' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (entryTime < thirtyDaysAgo) {
      return new Response(
        JSON.stringify({ error: 'Cannot enter metrics older than 30 days' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if manual entry already exists at this exact time
    const existingEntry = await prisma.biometric_data.findFirst({
      where: {
        patient_id: patientId,
        metric_type: metric_type,
        is_user_entered: true,
        timestamp: entryTime,
      },
    });

    let result;
    if (existingEntry) {
      // Update existing manual entry
      result = await prisma.biometric_data.update({
        where: { id: existingEntry.id },
        data: {
          value: Math.round(value * 100) / 100,
          source: 'manual',
          is_user_entered: true,
        },
      });
    } else {
      // Create new manual entry
      result = await prisma.biometric_data.create({
        data: {
          patient_id: patientId,
          metric_type: metric_type,
          value: Math.round(value * 100) / 100,
          timestamp: entryTime,
          source: 'manual',
          is_user_entered: true,
        },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Manual entry recorded successfully',
        data: {
          id: result.id,
          metric_type: result.metric_type,
          value: parseFloat(result.value),
          timestamp: result.timestamp,
          is_user_entered: result.is_user_entered,
        },
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error creating manual entry:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * GET /api/biometrics/manual-entry
 * Get all manual entries for a user
 * 
 * Query params:
 * - metric_type: filter by metric type (optional)
 * - date: filter to specific date YYYY-MM-DD (optional)
 */
export async function GET(req) {
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
    const url = new URL(req.url);
    const metricType = url.searchParams.get('metric_type');
    const dateParam = url.searchParams.get('date');

    const where = {
      patient_id: patientId,
      is_user_entered: true,
    };

    if (metricType) {
      where.metric_type = metricType;
    }

    if (dateParam) {
      const [year, month, day] = dateParam.split('-').map(Number);
      const startDate = new Date(year, month - 1, day, 0, 0, 0, 0);
      const endDate = new Date(year, month - 1, day, 23, 59, 59, 999);

      where.timestamp = {
        gte: startDate,
        lte: endDate,
      };
    }

    const entries = await prisma.biometric_data.findMany({
      where,
      orderBy: {
        timestamp: 'desc',
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        count: entries.length,
        data: entries.map(entry => ({
          id: entry.id,
          metric_type: entry.metric_type,
          value: parseFloat(entry.value),
          timestamp: entry.timestamp,
          is_user_entered: entry.is_user_entered,
          created_at: entry.created_at,
        })),
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching manual entries:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
