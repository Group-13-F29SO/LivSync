import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export async function DELETE(req) {
  try {
    // Get the session from cookies
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
    } catch (error) {
      return new Response(
        JSON.stringify({ error: 'Invalid session' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get the patient ID from the session
    const patientId = session.userId;

    // Get date from request body
    const { date } = await req.json();
    
    if (!date) {
      return new Response(
        JSON.stringify({ error: 'Date is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Parse the date - delete entire calendar day (midnight to midnight)
    // Also delete the previous night's sleep that extends into this morning
    const targetDate = new Date(date + 'T00:00:00');
    const previousDate = new Date(targetDate);
    previousDate.setDate(previousDate.getDate() - 1);

    // Delete from 10 PM previous day through midnight of current day
    const startDate = new Date(previousDate);
    startDate.setHours(22, 0, 0, 0); // Previous day 10 PM

    const endDate = new Date(targetDate);
    endDate.setDate(endDate.getDate() + 1); // Next day
    endDate.setHours(0, 0, 0, 0); // Midnight of next day

    const deleted = await prisma.biometric_data.deleteMany({
      where: {
        patient_id: patientId,
        metric_type: 'sleep',
        timestamp: {
          gte: startDate,
          lt: endDate
        }
      }
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: `Deleted ${deleted.count} sleep data points for ${date}`,
        count: deleted.count,
        date: date
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error deleting sleep data:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to delete sleep data', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
