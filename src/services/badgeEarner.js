/**
 * Badge Earning Engine
 * Checks achievement criteria and awards badges to users
 */

import { prisma } from '@/lib/prisma';
import { BADGE_DEFINITIONS } from './badgeDefinitions';

/**
 * Get biometric data for analysis
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
 * Get biometric data for last N days
 */
async function getBiometricDataLastNDays(patientId, metricType, days) {
  const now = new Date();
  const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  return await getBiometricData(patientId, metricType, startDate, now);
}

/**
 * Get all biometric data for a patient on a specific date
 */
async function getBiometricDataOnDate(patientId, date) {
  const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

  return await prisma.biometric_data.findMany({
    where: {
      patient_id: patientId,
      timestamp: {
        gte: startOfDay,
        lt: endOfDay,
      },
    },
  });
}

/**
 * Get sum of metric values for a date range
 */function getSumValue(dataPoints) {
  return dataPoints.reduce((sum, point) => sum + parseFloat(point.value), 0);
}

/**
 * Get average of metric values
 */
function getAverageValue(dataPoints) {
  if (dataPoints.length === 0) return 0;
  return getSumValue(dataPoints) / dataPoints.length;
}

/**
 * Get max value from datapoints
 */
function getMaxValue(dataPoints) {
  if (dataPoints.length === 0) return 0;
  return Math.max(...dataPoints.map((p) => parseFloat(p.value)));
}

/**
 * Check if badge criteria are met
 */
async function checkBadgeCriteria(patientId, badgeDef) {
  const { criteria } = badgeDef;

  try {
    switch (criteria.type) {
      case 'daily_metric_threshold':
        return await checkDailyMetricThreshold(patientId, criteria);

      case 'total_metric_threshold':
        return await checkTotalMetricThreshold(patientId, criteria);

      case 'daily_logging_streak':
        return await checkDailyLoggingStreak(patientId, criteria);

      case 'daily_metric_logging_streak':
        return await checkDailyMetricLoggingStreak(patientId, criteria);

      case 'total_metric_count':
        return await checkTotalMetricCount(patientId, criteria);

      case 'daily_goal_completion':
        return await checkDailyGoalCompletion(patientId, criteria);

      case 'daily_goal_streak':
        return await checkDailyGoalStreak(patientId, criteria);

      case 'daily_metric_threshold_streak':
        return await checkDailyMetricThresholdStreak(patientId, criteria);

      case 'average_metric_threshold':
        return await checkAverageMetricThreshold(patientId, criteria);

      case 'first_entry':
        return await checkFirstEntry(patientId, criteria);

      default:
        return false;
    }
  } catch (error) {
    console.error(`Error checking badge criteria for ${badgeDef.id}:`, error);
    return false;
  }
}

/**
 * Check daily metric threshold (e.g., 10,000 steps in one day)
 */
async function checkDailyMetricThreshold(patientId, criteria) {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

  const data = await getBiometricData(patientId, criteria.metric, startOfDay, endOfDay);
  const sum = getSumValue(data);

  return sum >= criteria.threshold;
}

/**
 * Check total metric threshold (cumulative across all time)
 */
async function checkTotalMetricThreshold(patientId, criteria) {
  const data = await prisma.biometric_data.findMany({
    where: {
      patient_id: patientId,
      metric_type: criteria.metric,
    },
  });

  const sum = getSumValue(data);
  return sum >= criteria.threshold;
}

/**
 * Check daily logging streak (any metric logged)
 */
async function checkDailyLoggingStreak(patientId, criteria) {
  const now = new Date();
  const requiredDays = criteria.days;

  // Get all dates with entries in the last N+10 days (to account for gaps)
  const startDate = new Date(now.getTime() - (requiredDays + 10) * 24 * 60 * 60 * 1000);

  const data = await prisma.biometric_data.findMany({
    where: {
      patient_id: patientId,
      timestamp: {
        gte: startDate,
        lt: now,
      },
    },
    orderBy: {
      timestamp: 'desc',
    },
  });

  // Get unique days
  const daysWithEntries = new Set();
  data.forEach((entry) => {
    const date = new Date(entry.timestamp);
    const dateStr = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    daysWithEntries.add(dateStr);
  });

  // Check if we have N consecutive days
  let consecutiveDays = 0;
  let currentDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  for (let i = 0; i < requiredDays; i++) {
    const dateStr = `${currentDate.getFullYear()}-${currentDate.getMonth()}-${currentDate.getDate()}`;
    if (daysWithEntries.has(dateStr)) {
      consecutiveDays++;
    } else {
      break;
    }
    currentDate = new Date(currentDate.getTime() - 24 * 60 * 60 * 1000);
  }

  return consecutiveDays >= requiredDays;
}

/**
 * Check daily metric logging streak (specific metric logged)
 */
async function checkDailyMetricLoggingStreak(patientId, criteria) {
  const now = new Date();
  const requiredDays = criteria.days;

  // Get all dates with the specific metric in the last N+10 days
  const startDate = new Date(now.getTime() - (requiredDays + 10) * 24 * 60 * 60 * 1000);

  const data = await prisma.biometric_data.findMany({
    where: {
      patient_id: patientId,
      metric_type: criteria.metric,
      timestamp: {
        gte: startDate,
        lt: now,
      },
    },
    orderBy: {
      timestamp: 'desc',
    },
  });

  // Get unique days
  const daysWithEntries = new Set();
  data.forEach((entry) => {
    const date = new Date(entry.timestamp);
    const dateStr = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    daysWithEntries.add(dateStr);
  });

  // Check if we have N consecutive days
  let consecutiveDays = 0;
  let currentDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  for (let i = 0; i < requiredDays; i++) {
    const dateStr = `${currentDate.getFullYear()}-${currentDate.getMonth()}-${currentDate.getDate()}`;
    if (daysWithEntries.has(dateStr)) {
      consecutiveDays++;
    } else {
      break;
    }
    currentDate = new Date(currentDate.getTime() - 24 * 60 * 60 * 1000);
  }

  return consecutiveDays >= requiredDays;
}

/**
 * Check total metric count (e.g., 100+ entries)
 */
async function checkTotalMetricCount(patientId, criteria) {
  const count = await prisma.biometric_data.count({
    where: {
      patient_id: patientId,
      metric_type: criteria.metric,
    },
  });

  return count >= criteria.threshold;
}

/**
 * Check daily goal completion streak
 */
async function checkDailyGoalCompletion(patientId, criteria) {
  // This would require tracking goal completions
  // For now, we'll implement a basic version
  // In a full implementation, you'd track goal progress separately
  
  // Get goals for this patient
  const goals = await prisma.goals.findMany({
    where: {
      patient_id: patientId,
      is_active: true,
    },
  });

  if (goals.length === 0) {
    return false;
  }

  // For each active goal, check if it was met for the required number of days
  // This is a simplified check - a full implementation would track daily completions
  return true; // Placeholder
}

/**
 * Check daily goal streak (specific goal type)
 */
async function checkDailyGoalStreak(patientId, criteria) {
  const now = new Date();
  const requiredDays = criteria.days;
  const goalType = criteria.goalType;

  // Get the user's goal for this goal type
  const goal = await prisma.goals.findFirst({
    where: {
      patient_id: patientId,
      metric_type: goalType,
      is_active: true,
    },
  });

  // If no goal set, can't complete it
  if (!goal) {
    return false;
  }

  const targetValue = goal.target_value;

  // Get all data for the goal type in the last N+10 days
  const startDate = new Date(now.getTime() - (requiredDays + 10) * 24 * 60 * 60 * 1000);

  const data = await prisma.biometric_data.findMany({
    where: {
      patient_id: patientId,
      metric_type: goalType,
      timestamp: {
        gte: startDate,
        lt: now,
      },
    },
    orderBy: {
      timestamp: 'desc',
    },
  });

  // Group by day and sum values
  const daysWithGoalMet = new Set();
  const dayGroups = {};

  data.forEach((entry) => {
    const date = new Date(entry.timestamp);
    const dateStr = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    if (!dayGroups[dateStr]) {
      dayGroups[dateStr] = [];
    }
    dayGroups[dateStr].push(parseFloat(entry.value));
  });

  // Check which days met the goal
  Object.entries(dayGroups).forEach(([dateStr, values]) => {
    const sum = values.reduce((a, b) => a + b, 0);
    if (sum >= targetValue) {
      daysWithGoalMet.add(dateStr);
    }
  });

  // Check for consecutive days from today backwards
  let consecutiveDays = 0;
  let currentDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  for (let i = 0; i < requiredDays; i++) {
    const dateStr = `${currentDate.getFullYear()}-${currentDate.getMonth()}-${currentDate.getDate()}`;
    if (daysWithGoalMet.has(dateStr)) {
      consecutiveDays++;
    } else {
      break;
    }
    currentDate = new Date(currentDate.getTime() - 24 * 60 * 60 * 1000);
  }

  return consecutiveDays >= requiredDays;
}

/**
 * Check daily metric threshold streak (e.g., 8+ hours sleep for 7 days)
 */
async function checkDailyMetricThresholdStreak(patientId, criteria) {
  const now = new Date();
  const requiredDays = criteria.days;
  const startDate = new Date(now.getTime() - (requiredDays + 10) * 24 * 60 * 60 * 1000);

  const data = await prisma.biometric_data.findMany({
    where: {
      patient_id: patientId,
      metric_type: criteria.metric,
      timestamp: {
        gte: startDate,
        lt: now,
      },
    },
    orderBy: {
      timestamp: 'desc',
    },
  });

  // Group by day and check threshold
  const daysWithThreshold = new Set();
  const dayGroups = {};

  data.forEach((entry) => {
    const date = new Date(entry.timestamp);
    const dateStr = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    if (!dayGroups[dateStr]) {
      dayGroups[dateStr] = [];
    }
    dayGroups[dateStr].push(parseFloat(entry.value));
  });

  // Check which days meet the threshold
  Object.entries(dayGroups).forEach(([dateStr, values]) => {
    const sum = values.reduce((a, b) => a + b, 0);
    const operator = criteria.operator || 'gte';

    if (operator === 'gte' && sum >= criteria.threshold) {
      daysWithThreshold.add(dateStr);
    } else if (operator === 'lte' && sum <= criteria.threshold) {
      daysWithThreshold.add(dateStr);
    }
  });

  // Check for consecutive days from today backwards
  let consecutiveDays = 0;
  let currentDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  for (let i = 0; i < requiredDays; i++) {
    const dateStr = `${currentDate.getFullYear()}-${currentDate.getMonth()}-${currentDate.getDate()}`;
    if (daysWithThreshold.has(dateStr)) {
      consecutiveDays++;
    } else {
      break;
    }
    currentDate = new Date(currentDate.getTime() - 24 * 60 * 60 * 1000);
  }

  return consecutiveDays >= requiredDays;
}

/**
 * Check average metric threshold (e.g., average 8+ hours over 30 days)
 */
async function checkAverageMetricThreshold(patientId, criteria) {
  const now = new Date();
  const days = criteria.days;
  const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  const data = await prisma.biometric_data.findMany({
    where: {
      patient_id: patientId,
      metric_type: criteria.metric,
      timestamp: {
        gte: startDate,
        lt: now,
      },
    },
  });

  if (data.length === 0) {
    return false;
  }

  const average = getAverageValue(data);
  const operator = criteria.operator || 'gte';

  if (operator === 'gte') {
    return average >= criteria.threshold;
  } else if (operator === 'lte') {
    return average <= criteria.threshold;
  }

  return false;
}

/**
 * Check if this is user's first entry
 */
async function checkFirstEntry(patientId, criteria) {
  const count = await prisma.biometric_data.count({
    where: {
      patient_id: patientId,
    },
  });

  return count >= 1;
}

/**
 * Award a badge to a user
 */
export async function awardBadge(patientId, badgeId) {
  try {
    // Check if badge already awarded
    const existing = await prisma.user_achievements.findUnique({
      where: {
        patient_id_achievement_id: {
          patient_id: patientId,
          achievement_id: await getAchievementIdByBadgeId(badgeId),
        },
      },
    });

    if (existing) {
      return { success: false, message: 'Badge already earned', isNew: false };
    }

    // Get or create achievement
    const achievementId = await getOrCreateAchievement(badgeId);

    // Award badge
    const userAchievement = await prisma.user_achievements.create({
      data: {
        patient_id: patientId,
        achievement_id: achievementId,
        earned_at: new Date(),
      },
      include: {
        achievements: true,
      },
    });

    return {
      success: true,
      message: 'Badge awarded',
      badge: userAchievement,
      isNew: true,
    };
  } catch (error) {
    console.error('Error awarding badge:', error);
    return { success: false, message: 'Error awarding badge', isNew: false };
  }
}

/**
 * Get achievement ID by badge ID, creating if necessary
 */
async function getOrCreateAchievement(badgeId) {
  const badgeDef = BADGE_DEFINITIONS.find((b) => b.id === badgeId);
  if (!badgeDef) {
    throw new Error(`Badge not found: ${badgeId}`);
  }

  // Try to find existing
  let achievement = await prisma.achievements.findUnique({
    where: {
      name: badgeDef.name,
    },
  });

  // Create if doesn't exist
  if (!achievement) {
    achievement = await prisma.achievements.create({
      data: {
        name: badgeDef.name,
        description: badgeDef.description,
        icon_url: badgeDef.icon || null,
      },
    });
  }

  return achievement.id;
}

/**
 * Get achievement ID by badge ID
 */
async function getAchievementIdByBadgeId(badgeId) {
  const badgeDef = BADGE_DEFINITIONS.find((b) => b.id === badgeId);
  if (!badgeDef) {
    throw new Error(`Badge not found: ${badgeId}`);
  }

  const achievement = await prisma.achievements.findUnique({
    where: {
      name: badgeDef.name,
    },
  });

  if (!achievement) {
    return await getOrCreateAchievement(badgeId);
  }

  return achievement.id;
}

/**
 * Check all badges for a user and award any newly met badges
 */
export async function checkAndAwardNewBadges(patientId) {
  const results = [];

  for (const badgeDef of BADGE_DEFINITIONS) {
    try {
      // Check if already earned
      const achievementId = await getOrCreateAchievement(badgeDef.id);
      const existing = await prisma.user_achievements.findUnique({
        where: {
          patient_id_achievement_id: {
            patient_id: patientId,
            achievement_id: achievementId,
          },
        },
      });

      if (!existing) {
        // Check if criteria are met
        const criteria = await checkBadgeCriteria(patientId, badgeDef);

        if (criteria) {
          // Award the badge
          const result = await awardBadge(patientId, badgeDef.id);
          results.push({
            badgeId: badgeDef.id,
            badgeName: badgeDef.name,
            awarded: result.isNew,
            result,
          });
        }
      }
    } catch (error) {
      console.error(`Error processing badge ${badgeDef.id}:`, error);
    }
  }

  return results;
}

/**
 * Get badges earned by user
 */
export async function getUserEarnedBadges(patientId) {
  const userAchievements = await prisma.user_achievements.findMany({
    where: {
      patient_id: patientId,
    },
    include: {
      achievements: true,
    },
    orderBy: {
      earned_at: 'desc',
    },
  });

  // Find the badge definitions for each achievement
  return userAchievements.map((ua) => {
    const badgeDef = BADGE_DEFINITIONS.find((b) => b.name === ua.achievements.name);
    return {
      id: badgeDef?.id || ua.achievements.id,
      name: ua.achievements.name,
      description: ua.achievements.description,
      icon: badgeDef?.icon || null,
      category: badgeDef?.category || 'Other',
      earnedAt: ua.earned_at,
      earnedDate: ua.earned_at.toISOString().split('T')[0],
    };
  });
}

/**
 * Get all badges with earned status for user
 */
export async function getUserBadgesWithStatus(patientId) {
  const earned = await getUserEarnedBadges(patientId);
  const earnedIds = new Set(earned.map((b) => b.id));

  // Recalculate each badge to ensure criteria are still met
  const badgesWithRecalculation = await Promise.all(
    BADGE_DEFINITIONS.map(async (badgeDef) => {
      let isEarned = earnedIds.has(badgeDef.id);
      
      // If previously earned, verify criteria are still met
      if (isEarned) {
        const stillMeetsCriteria = await checkBadgeCriteria(patientId, badgeDef);
        isEarned = stillMeetsCriteria;
      }

      const earnedBadge = earned.find((b) => b.id === badgeDef.id);

      return {
        id: badgeDef.id,
        name: badgeDef.name,
        description: badgeDef.description,
        icon: badgeDef.icon,
        category: badgeDef.category,
        status: isEarned ? 'earned' : 'locked',
        earnedDate: isEarned ? earnedBadge?.earnedDate || null : null,
      };
    })
  );

  return badgesWithRecalculation;
}

/**
 * Clean up invalid achievements (delete from database if no longer earned)
 */
export async function cleanupInvalidAchievements(patientId) {
  try {
    const earned = await getUserEarnedBadges(patientId);

    // Check each earned badge to verify criteria are still met
    const invalidBadges = [];

    for (const earnedBadge of earned) {
      const badgeDef = BADGE_DEFINITIONS.find((b) => b.id === earnedBadge.id);

      if (badgeDef) {
        const stillMeetsCriteria = await checkBadgeCriteria(patientId, badgeDef);

        // If criteria no longer met, mark for deletion
        if (!stillMeetsCriteria) {
          invalidBadges.push(badgeDef.id);
        }
      }
    }

    // Delete invalid achievements from database
    const achievementIds = await Promise.all(
      invalidBadges.map(async (badgeId) => {
        try {
          return await getOrCreateAchievement(badgeId);
        } catch (error) {
          console.error(`Error getting achievement ID for ${badgeId}:`, error);
          return null;
        }
      })
    );

    const validAchievementIds = achievementIds.filter((id) => id !== null);

    if (validAchievementIds.length > 0) {
      const deleteResult = await prisma.user_achievements.deleteMany({
        where: {
          patient_id: patientId,
          achievement_id: {
            in: validAchievementIds,
          },
        },
      });

      console.log(`Cleaned up ${deleteResult.count} invalid achievements for patient ${patientId}`);
      return deleteResult.count;
    }

    return 0;
  } catch (error) {
    console.error('Error cleaning up invalid achievements:', error);
    return 0;
  }
}
