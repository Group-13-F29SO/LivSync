import { prisma } from '@/lib/prisma';

/**
 * Recommendation Engine - Generates rule-based and correlation-based health recommendations
 */

// Helper function to get today's date in ISO format
const getTodayStart = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
};

const getTodayEnd = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
};

const getNoonTime = () => {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);
};

/**
 * Get biometric data for a specific metric type and date range
 */
async function getBiometricData(patientId, metricType, startDate, endDate) {
  return await prisma.biometric_data.findMany({
    where: {
      patient_id: patientId,
      metric_type: metricType,
      timestamp: {
        gte: startDate,
        lt: endDate,
      },
    },
    orderBy: {
      timestamp: 'desc',
    },
  });
}

/**
 * Get biometric data for the last N days
 */
async function getBiometricDataLastDays(patientId, metricType, days) {
  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);
  return await getBiometricData(patientId, metricType, startDate, endDate);
}

/**
 * Calculate average value for a metabolic type
 */
function getAverageValue(dataPoints) {
  if (dataPoints.length === 0) return 0;
  const sum = dataPoints.reduce((acc, point) => acc + parseFloat(point.value), 0);
  return sum / dataPoints.length;
}

/**
 * Get the sum of values for a metric type
 */
function getSumValue(dataPoints) {
  return dataPoints.reduce((acc, point) => acc + parseFloat(point.value), 0);
}

/**
 * Rule-based recommendation: Low activity warning (steps)
 */
async function checkLowActivityByNoon(patientId) {
  const now = new Date();
  const noon = getNoonTime();

  // Only trigger between 12 PM and 5 PM
  if (now.getHours() < 12 || now.getHours() >= 17) {
    return null;
  }

  const todayStart = getTodayStart();
  const stepsToday = await getBiometricData(patientId, 'steps', todayStart, noon);
  const totalSteps = getSumValue(stepsToday);

  if (totalSteps < 1000) {
    return {
      title: 'Time for a Walk!',
      message: `You've only taken ${Math.round(totalSteps)} steps by noon. How about a lunchtime walk to energize your afternoon?`,
      type: 'activity',
      priority: 'high',
      actionType: 'log_activity',
      actionData: JSON.stringify({ metricType: 'steps' }),
    };
  }

  return null;
}

/**
 * Rule-based recommendation: Hydration reminder
 */
async function checkHydrationReminder(patientId) {
  const now = new Date();
  
  // Don't trigger between 9 PM and 7 AM
  if (now.getHours() < 7 || now.getHours() >= 21) {
    return null;
  }

  const todayStart = getTodayStart();
  const todayEnd = getTodayEnd();
  const waterData = await getBiometricData(patientId, 'hydration', todayStart, todayEnd);
  const totalWater = getSumValue(waterData);

  // If less than 6 glasses (1.5L) by current time
  const hoursElapsed = now.getHours();
  const expectedWater = (hoursElapsed / 24) * 8; // 8 glasses per day

  if (totalWater < expectedWater) {
    return {
      title: 'Stay Hydrated!',
      message: `Don't forget to drink water! You're ${Math.round(expectedWater - totalWater)} glasses behind your daily hydration goal.`,
      type: 'hydration',
      priority: 'medium',
      actionType: 'log_hydration',
      actionData: JSON.stringify({ metricType: 'hydration' }),
    };
  }

  return null;
}

/**
 * Rule-based recommendation: Sleep quality warning
 */
async function checkSleepQuality(patientId) {
  const now = new Date();
  
  // Only check in the morning
  if (now.getHours() < 7 || now.getHours() >= 12) {
    return null;
  }

  const sleepData = await getBiometricDataLastDays(patientId, 'sleep', 7);
  if (sleepData.length === 0) return null;

  const avgSleep = getAverageValue(sleepData);
  const lastNightSleep = sleepData[0];

  if (avgSleep < 7) {
    return {
      title: 'Poor Sleep Pattern Detected',
      message: `Your average sleep last week was ${avgSleep.toFixed(1)} hours. Getting 7-8 hours helps your body recover and improves your health outcomes.`,
      type: 'sleep',
      priority: 'medium',
      actionType: 'view_sleep_insights',
      actionData: JSON.stringify({ metric: 'sleep' }),
    };
  }

  return null;
}

/**
 * Rule-based recommendation: High blood glucose alert
 */
async function checkHighBloodGlucose(patientId) {
  const todayStart = getTodayStart();
  const todayEnd = getTodayEnd();
  const glucoseData = await getBiometricData(patientId, 'blood_glucose', todayStart, todayEnd);

  if (glucoseData.length === 0) return null;

  const avgGlucose = getAverageValue(glucoseData);
  
  if (avgGlucose > 140) {
    return {
      title: 'Elevated Blood Glucose Levels',
      message: `Your average blood glucose today is ${avgGlucose.toFixed(0)} mg/dL. Consider reviewing your diet and consulting your healthcare provider if levels remain high.`,
      type: 'blood_glucose',
      priority: 'high',
      actionType: 'log_glucose',
      actionData: JSON.stringify({ metricType: 'blood_glucose' }),
    };
  }

  return null;
}

/**
 * Rule-based recommendation: Heart rate alert
 */
async function checkAbnormalHeartRate(patientId) {
  const todayStart = getTodayStart();
  const todayEnd = getTodayEnd();
  const hrData = await getBiometricData(patientId, 'heart_rate', todayStart, todayEnd);

  if (hrData.length === 0) return null;

  const avgHR = getAverageValue(hrData);
  
  if (avgHR > 100) {
    return {
      title: 'Elevated Heart Rate',
      message: `Your average heart rate is ${avgHR.toFixed(0)} bpm. Ensure you're getting enough rest and hydration. If elevated readings persist, consult your doctor.`,
      type: 'heart_rate',
      priority: 'high',
      actionType: 'log_heart_rate',
      actionData: JSON.stringify({ metricType: 'heart_rate' }),
    };
  } else if (avgHR < 50) {
    return {
      title: 'Low Heart Rate',
      message: `Your average heart rate is ${avgHR.toFixed(0)} bpm. While low resting rates can be normal, discuss any concerns with your healthcare provider.`,
      type: 'heart_rate',
      priority: 'medium',
      actionType: 'log_heart_rate',
      actionData: JSON.stringify({ metricType: 'heart_rate' }),
    };
  }

  return null;
}

/**
 * Correlation: Exercise improves sleep quality
 */
async function checkExerciseAndSleepCorrelation(patientId) {
  const sleepData = await getBiometricDataLastDays(patientId, 'sleep', 14);
  const stepsData = await getBiometricDataLastDays(patientId, 'steps', 14);

  if (sleepData.length < 7 || stepsData.length === 0) return null;

  // Get last 7 days of sleep data
  const lastWeekSleep = sleepData.slice(0, 7);
  
  // Compare days with high activity vs low activity
  let highActivityDaySleep = [];
  let lowActivityDaySleep = [];

  for (let i = 0; i < 7; i++) {
    const dayStart = new Date(new Date().getTime() - i * 24 * 60 * 60 * 1000);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

    const daySteps = stepsData.filter(
      (s) => new Date(s.timestamp) >= dayStart && new Date(s.timestamp) < dayEnd
    );
    const dayStepTotal = getSumValue(daySteps);

    const daySleep = sleepData.find(
      (s) => new Date(s.timestamp) >= dayStart && new Date(s.timestamp) < dayEnd
    );

    if (daySleep) {
      if (dayStepTotal > 5000) {
        highActivityDaySleep.push(parseFloat(daySleep.value));
      } else if (dayStepTotal < 2000) {
        lowActivityDaySleep.push(parseFloat(daySleep.value));
      }
    }
  }

  if (highActivityDaySleep.length > 0 && lowActivityDaySleep.length > 0) {
    const avgHighActivity = highActivityDaySleep.reduce((a, b) => a + b, 0) / highActivityDaySleep.length;
    const avgLowActivity = lowActivityDaySleep.reduce((a, b) => a + b, 0) / lowActivityDaySleep.length;

    if (avgHighActivity > avgLowActivity + 0.5) {
      return {
        title: 'Exercise Helps You Sleep Better',
        message: `We've noticed you sleep ${(avgHighActivity - avgLowActivity).toFixed(1)} hours better on days you're more active. Keep up the movement!`,
        type: 'insight',
        priority: 'low',
        actionType: 'view_insights',
        actionData: JSON.stringify({ insight: 'exercise_sleep_correlation' }),
      };
    }
  }

  return null;
}

/**
 * Correlation: Hydration and energy levels
 */
async function checkHydrationEnergyCorrelation(patientId) {
  const hydroData = await getBiometricDataLastDays(patientId, 'hydration', 14);
  const calorieData = await getBiometricDataLastDays(patientId, 'calories', 14);

  if (hydroData.length < 7 || calorieData.length === 0) return null;

  // Get today's hydration data specifically
  const todayStart = getTodayStart();
  const todayEnd = getTodayEnd();
  const todayHydroData = await getBiometricData(patientId, 'hydration', todayStart, todayEnd);
  const todayHydration = getSumValue(todayHydroData);
  
  if (todayHydration < 6) {
    return {
      title: 'Boost Your Energy with Hydration',
      message: `Your hydration levels are low (${todayHydration.toFixed(1)} glasses today). Studies show proper hydration can increase energy and mental clarity. Try to reach 8 glasses daily!`,
      type: 'insight',
      priority: 'medium',
      actionType: 'log_hydration',
      actionData: JSON.stringify({ metricType: 'hydration' }),
    };
  }

  return null;
}

/**
 * Goal-based recommendation: Progress towards active goals
 */
async function checkGoalProgress(patientId) {
  const goals = await prisma.goals.findMany({
    where: {
      patient_id: patientId,
      is_active: true,
    },
  });

  if (goals.length === 0) return null;

  const recommendations = [];

  for (const goal of goals) {
    const todayStart = getTodayStart();
    const todayEnd = getTodayEnd();
    
    const todayData = await getBiometricData(
      patientId,
      goal.metric_type,
      todayStart,
      todayEnd
    );

    const todayValue = getSumValue(todayData);
    const progressPercent = (todayValue / goal.target_value) * 100;

    if (progressPercent < 25) {
      recommendations.push({
        title: `Keep Going on Your ${goal.metric_type} Goal!`,
        message: `You're ${progressPercent.toFixed(0)}% towards your daily ${goal.metric_type} goal of ${goal.target_value}. You've got this!`,
        type: 'goal_progress',
        priority: 'low',
        actionType: 'log_metric',
        actionData: JSON.stringify({ metricType: goal.metric_type }),
      });
    } else if (progressPercent < 75) {
      recommendations.push({
        title: `Great Progress on ${goal.metric_type}!`,
        message: `You're ${progressPercent.toFixed(0)}% complete with your ${goal.metric_type} goal. Keep up the momentum!`,
        type: 'goal_progress',
        priority: 'low',
        actionType: 'log_metric',
        actionData: JSON.stringify({ metricType: goal.metric_type }),
      });
    }
  }

  return recommendations.length > 0 ? recommendations[0] : null;
}

/**
 * Main function: Generate all recommendations for a patient
 */
export async function generateRecommendations(patientId) {
  try {
    const recommendations = [];

    // Check all rule-based recommendations
    const lowActivityRec = await checkLowActivityByNoon(patientId);
    if (lowActivityRec) recommendations.push(lowActivityRec);

    const hydrationRec = await checkHydrationReminder(patientId);
    if (hydrationRec) recommendations.push(hydrationRec);

    const sleepRec = await checkSleepQuality(patientId);
    if (sleepRec) recommendations.push(sleepRec);

    const glucoseRec = await checkHighBloodGlucose(patientId);
    if (glucoseRec) recommendations.push(glucoseRec);

    const hrRec = await checkAbnormalHeartRate(patientId);
    if (hrRec) recommendations.push(hrRec);

    // Check correlations
    const exerciseSleepRec = await checkExerciseAndSleepCorrelation(patientId);
    if (exerciseSleepRec) recommendations.push(exerciseSleepRec);

    const hydrationEnergyRec = await checkHydrationEnergyCorrelation(patientId);
    if (hydrationEnergyRec) recommendations.push(hydrationEnergyRec);

    // Check goal progress
    const goalRec = await checkGoalProgress(patientId);
    if (goalRec) recommendations.push(goalRec);

    return recommendations;
  } catch (error) {
    console.error('Error generating recommendations:', error);
    return [];
  }
}

/**
 * Create a notification for a patient
 */
export async function createNotification(patientId, recommendation) {
  try {
    // Check if a similar notification already exists in the last 24 hours
    const existingNotification = await prisma.notifications.findFirst({
      where: {
        patient_id: patientId,
        title: recommendation.title,
        created_at: {
          gte: new Date(new Date().getTime() - 24 * 60 * 60 * 1000),
        },
        is_read: false,
      },
    });

    // If similar notification exists, don't create duplicate
    if (existingNotification) {
      return existingNotification;
    }

    const notification = await prisma.notifications.create({
      data: {
        patient_id: patientId,
        title: recommendation.title,
        message: recommendation.message,
        notification_type: recommendation.type,
        priority: recommendation.priority,
        action_type: recommendation.actionType,
        action_data: recommendation.actionData,
      },
    });

    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
}

/**
 * Get unread notifications for a patient
 */
export async function getUnreadNotifications(patientId, limit = 10) {
  try {
    return await prisma.notifications.findMany({
      where: {
        patient_id: patientId,
        is_read: false,
        dismissed_at: null,
      },
      orderBy: [
        { priority: 'asc' }, // high priority first
        { created_at: 'desc' },
      ],
      take: limit,
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId) {
  try {
    return await prisma.notifications.update({
      where: { id: notificationId },
      data: { is_read: true },
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
}

/**
 * Dismiss a notification
 */
export async function dismissNotification(notificationId) {
  try {
    return await prisma.notifications.update({
      where: { id: notificationId },
      data: {
        dismissed_at: new Date(),
        is_read: true,
      },
    });
  } catch (error) {
    console.error('Error dismissing notification:', error);
    throw error;
  }
}

/**
 * Create a prescription notification for a patient
 */
export async function createPrescriptionNotification(patientId, providerName, medicineNames) {
  try {
    const medicineList = Array.isArray(medicineNames) ? medicineNames.join(', ') : medicineNames;
    const title = 'New Prescription Issued';
    const message = `Dr. ${providerName} has issued a new prescription for: ${medicineList}. Visit your prescriptions page to view details.`;

    const notification = await prisma.notifications.create({
      data: {
        patient_id: patientId,
        title,
        message,
        notification_type: 'prescription',
        priority: 'high',
        action_type: 'view_prescriptions',
        action_data: JSON.stringify({ path: '/patient/prescriptions' }),
      },
    });

    return notification;
  } catch (error) {
    console.error('Error creating prescription notification:', error);
    throw error;
  }
}

/**
 * Get all notifications for a patient (including read/dismissed)
 */
export async function getAllNotifications(patientId, limit = 50) {
  try {
    return await prisma.notifications.findMany({
      where: {
        patient_id: patientId,
      },
      orderBy: [
        { created_at: 'desc' },
      ],
      take: limit,
    });
  } catch (error) {
    console.error('Error fetching all notifications:', error);
    throw error;
  }
}
