import { prisma } from '@/lib/prisma';

/**
 * Check if a patient achieved their goals for a specific date
 */
export async function checkGoalAchievement(patientId, targetDate = new Date()) {
  try {
    const patient = await prisma.patients.findUnique({
      where: { id: patientId },
      include: { goals: { where: { is_active: true } } },
    });

    if (!patient || patient.goals.length === 0) {
      return { achieved: false, goals: [], message: null };
    }

    const achievements = [];
    const unachievedGoals = [];

    for (const goal of patient.goals) {
      // Check if goal was achieved on the target date
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      const biometricData = await prisma.biometric_data.findFirst({
        where: {
          patient_id: patientId,
          metric_type: goal.metric_type,
          timestamp: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      });

      if (biometricData && Number(biometricData.value) >= goal.target_value) {
        achievements.push({
          goalId: goal.id,
          metricType: goal.metric_type,
          targetValue: goal.target_value,
          achieved: true,
        });
      } else {
        unachievedGoals.push({
          goalId: goal.id,
          metricType: goal.metric_type,
          targetValue: goal.target_value,
          achieved: false,
        });
      }
    }

    return {
      achieved: unachievedGoals.length === 0,
      goals: achievements,
      unachievedGoals,
      message: null,
    };
  } catch (error) {
    console.error('Error checking goal achievement:', error);
    throw error;
  }
}

/**
 * Generate goal reminder notification message
 */
export function generateGoalReminderMessage(unachievedGoals) {
  if (!unachievedGoals || unachievedGoals.length === 0) {
    return null;
  }

  const goalsList = unachievedGoals
    .map((g) => g.metricType.replaceAll('_', ' '))
    .join(', ');

  return `You haven't achieved your ${goalsList} goal${unachievedGoals.length > 1 ? 's' : ''} today. Keep pushing! 💪 Try again tomorrow and you've got this!`;
}

/**
 * Send goal reminder notification to a patient
 */
export async function sendGoalReminderNotification(patientId, unachievedGoals, message) {
  try {
    if (!message || unachievedGoals.length === 0) {
      return null;
    }

    const notification = await prisma.notifications.create({
      data: {
        patient_id: patientId,
        title: 'Goal Reminder',
        message,
        notification_type: 'goal_reminder',
        priority: 'medium',
        is_read: false,
        action_type: 'view_goals',
        action_data: JSON.stringify({ unachievedCountMetrics: unachievedGoals.map((g) => g.metricType) }),
      },
    });

    return notification;
  } catch (error) {
    console.error('Error sending goal reminder notification:', error);
    throw error;
  }
}

/**
 * Check if patient has missed goals for multiple consecutive days
 */
export async function checkConsecutiveMissedDays(patientId, consecutiveDays = 3) {
  try {
    const patient = await prisma.patients.findUnique({
      where: { id: patientId },
      include: { goals: { where: { is_active: true } } },
    });

    if (!patient || patient.goals.length === 0) {
      return { missedConsecutiveDays: false, daysMissed: 0 };
    }

    let consistentMissCount = 0;

    // Check the last N days
    for (let i = 1; i <= 10; i++) {
      const checkDate = new Date();
      checkDate.setDate(checkDate.getDate() - i);

      const result = await checkGoalAchievement(patientId, checkDate);

      if (!result.achieved && result.unachievedGoals.length > 0) {
        consistentMissCount++;
      } else {
        break; // Stop if a day was achieved
      }

      if (consistentMissCount >= consecutiveDays) {
        return { missedConsecutiveDays: true, daysMissed: consistentMissCount };
      }
    }

    return { missedConsecutiveDays: false, daysMissed: consistentMissCount };
  } catch (error) {
    console.error('Error checking consecutive missed days:', error);
    throw error;
  }
}

/**
 * Generate message for consecutive missed days
 */
export function generateConsecutiveMissMessage(daysMissed) {
  if (daysMissed < 3) {
    return null;
  }

  return `You haven't achieved your goals for the past ${daysMissed} days. Let's get back on track! 🚀 Start today and build that momentum!`;
}
