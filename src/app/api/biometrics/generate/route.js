/**
 * POST /api/biometrics/generate
 * Generate simulated biometric data for authenticated user
 */

import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import BiometricDataGenerator from '@/services/biometricGenerator';
import { checkAndAwardNewBadges } from '@/services/badgeEarner';

/**
 * Check if user is authenticated via session cookie
 */
function getAuthenticatedUser(request) {
  const cookie = request.cookies.get('livsync_session');
  
  if (!cookie) {
    console.log('No session cookie found');
    return null;
  }

  try {
    const session = JSON.parse(cookie.value);
    console.log('Session parsed:', { 
      hasUserId: !!session.userId, 
      userIdType: typeof session.userId,
      userId: session.userId 
    });
    return session;
  } catch (error) {
    console.error('Failed to parse session cookie:', error);
    return null;
  }
}

export async function POST(request) {
  try {
    // Authenticate user
    const session = getAuthenticatedUser(request);
    
    if (!session || !session.userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const patientId = session.userId;

    // Parse request body
    let date = new Date();
    let forceUpdate = false;
    try {
      const body = await request.json();
      if (body.date) {
        const parsedDate = new Date(body.date);
        if (!isNaN(parsedDate.getTime())) {
          date = parsedDate;
        }
      }
      if (body.force === true) {
        forceUpdate = true;
      }
    } catch (e) {
      // Request body is optional, use default date
    }

    // Normalize date to midnight
    date.setHours(0, 0, 0, 0);

    // Validate patient exists
    const patient = await prisma.patients.findUnique({
      where: { id: patientId }
    });

    if (!patient) {
      console.error('Patient not found in database:', { 
        patientId,
        patientIdType: typeof patientId 
      });
      return NextResponse.json(
        { success: false, error: 'Patient not found in database. Please ensure you are logged in correctly.' },
        { status: 404 }
      );
    }

    // Check if data already exists for this date
    const dateStart = new Date(date);
    dateStart.setHours(0, 0, 0, 0);
    const dateEnd = new Date(date);
    dateEnd.setHours(23, 59, 59, 999);

    const existingData = await prisma.biometric_data.findFirst({
      where: {
        patient_id: patientId,
        timestamp: {
          gte: dateStart,
          lt: dateEnd
        }
      }
    });

    // If data exists and no force flag, ask for confirmation
    if (existingData && !forceUpdate) {
      return NextResponse.json(
        {
          success: false,
          needsConfirmation: true,
          message: 'Data already exists for this date',
          error: 'Data already exists for today. Syncing again will replace existing data.'
        },
        { status: 409 }
      );
    }

    // If force update, delete existing data first
    if (existingData && forceUpdate) {
      await prisma.biometric_data.deleteMany({
        where: {
          patient_id: patientId,
          timestamp: {
            gte: dateStart,
            lt: dateEnd
          }
        }
      });
    }

    // Get the active device for this patient
    const activeDevice = await prisma.devices.findFirst({
      where: {
        patient_id: patientId,
        is_active: true
      }
    });

    // Create generator and generate data
    const generator = new BiometricDataGenerator(prisma);
    const result = await generator.generate(patientId, date, activeDevice?.device_name || 'manual');

    // Check for newly earned badges
    let newBadges = [];
    try {
      newBadges = await checkAndAwardNewBadges(patientId);
    } catch (error) {
      console.error('Error checking badges:', error);
      // Don't fail the request if badge checking fails
    }

    // Check for triggered alerts
    let alerts = [];
    try {
      // Fetch all the biometric data points that were just created for this date
      const biomarkerData = await prisma.biometric_data.findMany({
        where: {
          patient_id: patientId,
          timestamp: {
            gte: dateStart,
            lt: dateEnd
          }
        }
      });

      if (biomarkerData && biomarkerData.length > 0) {
        // Group data by metric type to find max values
        const dataByMetric = {};
        biomarkerData.forEach(point => {
          if (!dataByMetric[point.metric_type]) {
            dataByMetric[point.metric_type] = [];
          }
          dataByMetric[point.metric_type].push(point);
        });

        // Check thresholds for each metric
        for (const [metricType, dataPoints] of Object.entries(dataByMetric)) {
          // Fetch alert thresholds for this metric
          const threshold = await prisma.alert_thresholds.findUnique({
            where: {
              patient_id_metric_type: {
                patient_id: patientId,
                metric_type: metricType,
              },
            },
          });


          if (threshold && threshold.is_active) {
            const metricLabel = getMetricLabel(metricType);
            const metricUnit = getMetricUnit(metricType);

            // Find the max and min values for this metric
            const values = dataPoints.map(p => parseFloat(p.value));
            const maxValue = Math.max(...values);
            const minValue = Math.min(...values);
            const maxDataPoint = dataPoints.find(p => parseFloat(p.value) === maxValue);
            const minDataPoint = dataPoints.find(p => parseFloat(p.value) === minValue);

            // Check max threshold
            if (threshold.max_value && maxValue > parseFloat(threshold.max_value)) {
              const breachTimestamp = maxDataPoint.timestamp || new Date();
              
              const event = await prisma.critical_events.create({
                data: {
                  patient_id: patientId,
                  metric_type: metricType,
                  value: maxValue,
                  threshold_type: 'max',
                  threshold_value: parseFloat(threshold.max_value),
                  is_acknowledged: false,
                  created_at: breachTimestamp,
                },
              });

              // Create corresponding notification
              await prisma.notifications.create({
                data: {
                  patient_id: patientId,
                  title: `${metricLabel} Alert - Exceeds Threshold`,
                  message: `Your ${metricLabel.toLowerCase()} reading (${maxValue}${metricUnit ? ' ' + metricUnit : ''}) exceeded the maximum threshold of ${parseFloat(threshold.max_value)}${metricUnit ? ' ' + metricUnit : ''}.`,
                  notification_type: 'alert',
                  priority: 'high',
                  action_type: 'critical_event',
                  action_data: JSON.stringify({ event_id: event.id }),
                  created_at: breachTimestamp,
                },
              });

              alerts.push({
                id: event.id,
                metric_type: event.metric_type,
                value: event.value,
                threshold_type: event.threshold_type,
                threshold_value: event.threshold_value,
              });
            }

            // Check min threshold
            if (threshold.min_value && minValue < parseFloat(threshold.min_value)) {
              const breachTimestamp = minDataPoint.timestamp || new Date();
              
              const event = await prisma.critical_events.create({
                data: {
                  patient_id: patientId,
                  metric_type: metricType,
                  value: minValue,
                  threshold_type: 'min',
                  threshold_value: parseFloat(threshold.min_value),
                  is_acknowledged: false,
                  created_at: breachTimestamp,
                },
              });

              // Create corresponding notification
              await prisma.notifications.create({
                data: {
                  patient_id: patientId,
                  title: `${metricLabel} Alert - Below Threshold`,
                  message: `Your ${metricLabel.toLowerCase()} reading (${minValue}${metricUnit ? ' ' + metricUnit : ''}) fell below the minimum threshold of ${parseFloat(threshold.min_value)}${metricUnit ? ' ' + metricUnit : ''}.`,
                  notification_type: 'alert',
                  priority: 'medium',
                  action_type: 'critical_event',
                  action_data: JSON.stringify({ event_id: event.id }),
                  created_at: breachTimestamp,
                },
              });

              alerts.push({
                id: event.id,
                metric_type: event.metric_type,
                value: event.value,
                threshold_type: event.threshold_type,
                threshold_value: event.threshold_value,
              });
            }
          }
        }
      }
    } catch (error) {
      console.error('Error checking alert thresholds:', error);
      // Don't fail the request if threshold checking fails
    }

    // Helper function to get metric label
    function getMetricLabel(metricType) {
      const labels = {
        steps: 'Steps',
        heart_rate: 'Heart Rate',
        calories: 'Calories',
        hydration: 'Hydration',
        sleep: 'Sleep',
        blood_glucose: 'Blood Glucose',
      };
      return labels[metricType] || metricType;
    }

    // Helper function to get metric unit
    function getMetricUnit(metricType) {
      const units = {
        steps: '',
        heart_rate: 'bpm',
        calories: 'kcal',
        hydration: 'glasses',
        sleep: 'hrs',
        blood_glucose: 'mg/dL',
      };
      return units[metricType] || '';
    }

    // Trigger recommendation generation after biometric data is created
    try {
      const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/patient/recommendations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId })
      });
      
      if (response.ok) {
        const recData = await response.json();
        console.log(`Generated ${recData.recommendationsGenerated} recommendations for patient ${patientId}`);
      } else {
        console.warn('Failed to generate recommendations:', response.statusText);
      }
    } catch (recError) {
      console.error('Error triggering recommendations:', recError);
      // Don't fail the sync if recommendations fail, just log it
    }

    // Return success response
    return NextResponse.json(
      {
        success: true,
        message: 'Data generated successfully',
        data: result,
        newBadges: newBadges.filter((b) => b.awarded).map((b) => ({
          id: b.badgeId,
          name: b.badgeName,
        })),
        alerts: alerts,
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Biometrics generation error:', error);

    // Determine error type and respond accordingly
    if (error.message.includes('validation')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Data validation failed: ' + error.message
        },
        { status: 400 }
      );
    }

    if (error.message.includes('database')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Database error. Please try again later.'
        },
        { status: 500 }
      );
    }

    // Generic error response
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'An unexpected error occurred during data generation'
      },
      { status: 500 }
    );
  }
}
