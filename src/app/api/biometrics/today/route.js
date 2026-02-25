import { prisma } from '@/lib/prisma';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const patientId = searchParams.get('patientId');

    if (!patientId) {
      return Response.json({ error: 'patientId is required' }, { status: 400 });
    }

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // For sleep: fetch from yesterday 10 PM to today 10 AM (same logic as sleep endpoint)
    const sleepStart = new Date(today);
    sleepStart.setDate(sleepStart.getDate() - 1);
    sleepStart.setHours(22, 0, 0, 0); // Yesterday 10 PM
    
    const sleepEnd = new Date(today);
    sleepEnd.setHours(10, 0, 0, 0); // Today 10 AM

    // Fetch today's biometric data (for non-sleep metrics)
    const todayData = await prisma.biometric_data.findMany({
      where: {
        patient_id: patientId,
        timestamp: {
          gte: today,
          lt: tomorrow,
        },
      },
      select: {
        metric_type: true,
        value: true,
      },
    });

    // Fetch sleep data (spans yesterday evening to this morning)
    const sleepData = await prisma.biometric_data.findMany({
      where: {
        patient_id: patientId,
        metric_type: 'sleep',
        timestamp: {
          gte: sleepStart,
          lt: sleepEnd,
        },
      },
      orderBy: {
        timestamp: 'asc'
      },
      select: {
        metric_type: true,
        value: true,
        timestamp: true,
      },
    });

    // Aggregate by metric type
    const currentValueByMetric = {};

    // Process non-sleep metrics (sum for steps/calories, latest for others)
    for (const record of todayData) {
      const metric = record.metric_type;
      const numericValue = Number(record.value);
      
      if (['steps', 'calories'].includes(metric)) {
        // Sum these metrics (accumulative throughout day)
        currentValueByMetric[metric] = (currentValueByMetric[metric] || 0) + numericValue;
      } else {
        // For others, take the latest value
        currentValueByMetric[metric] = numericValue;
      }
    }

    // Process sleep data: take final accumulated value from morning (0-10 AM)
    let sleepValue = 0;
    let hasMorningData = false;
    
    for (const item of sleepData) {
      const hour = new Date(item.timestamp).getHours();
      if (hour < 10) {
        hasMorningData = true;
        // Get the final accumulated sleep value from morning
        sleepValue = Number(item.value);
      }
    }
    
    // Only set sleep if we have morning data (confirming sleep was completed and synced)
    if (hasMorningData) {
      currentValueByMetric.sleep = sleepValue;
    }

    // Map hydration to water for consistency with goals catalog
    if (currentValueByMetric.hydration !== undefined && currentValueByMetric.water === undefined) {
      currentValueByMetric.water = currentValueByMetric.hydration;
      delete currentValueByMetric.hydration;
    }

    return Response.json({ currentValues: currentValueByMetric });
  } catch (e) {
    console.error(e);
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}
