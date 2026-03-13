import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import SleepGenerator from '@/generators/sleepGenerator';

export async function POST(req) {
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

    // Parse the date
    const targetDate = new Date(date + 'T00:00:00');

    // Check if ANY data exists for this date
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const existingData = await prisma.biometric_data.findFirst({
      where: {
        patient_id: patientId,
        metric_type: 'sleep',
        timestamp: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      select: { source: true }
    });

    if (existingData) {
      return new Response(
        JSON.stringify({
          error: 'Cannot generate data for this date',
          message: `Data already exists for ${date} (source: ${existingData.source}). Please delete existing data first to generate simulated data.`
        }),
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Generate sleep data using the SleepGenerator
    const sleepGenerator = new SleepGenerator();
    const generatedData = sleepGenerator.generate(targetDate);

    // Add patient_id to each data point
    const dataWithPatientId = generatedData.map(item => ({
      ...item,
      patient_id: patientId
    }));

    // Create new sleep data
    const created = await prisma.biometric_data.createMany({
      data: dataWithPatientId
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: `Generated ${created.count} sleep data points for ${date}`,
        count: created.count,
        date: date
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error generating sleep data:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to generate sleep data', details: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}