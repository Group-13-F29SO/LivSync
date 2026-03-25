/**
 * Recommendation Job - Periodic Generation of Health Recommendations
 * 
 * This file should be integrated into your application's job/scheduler system.
 * You can use this with:
 * - node-cron: Scheduled jobs running in the main process
 * - Bull/BullMQ: Redis-based job queue
 * - Any other job scheduler
 * 
 * Example: node-cron integration
 */

import cron from 'node-cron';
import { prisma } from '@/lib/prisma';
import { generateRecommendations, createNotification } from '@/services/recommendationEngine';

/**
 * Initialize the recommendation job scheduler
 * Call this function once when your application starts
 */
export function initRecommendationJobs() {
  console.log('Initializing recommendation jobs...');

  // Job 1: Generate recommendations every 30 minutes
  cron.schedule('*/30 * * * *', async () => {
    console.log('Running recommendation generation job...');
    await generateRecommendationsForAllPatients();
  });

  // Job 2: Generate recommendations at specific times (good for reducing server load)
  // Morning: 7 AM, Midday: 12 PM, Evening: 6 PM, Night: 9 PM
  cron.schedule('0 7,12,18,21 * * *', async () => {
    console.log('Running scheduled recommendation generation (4x daily)...');
    await generateRecommendationsForAllPatients();
  });

  // Job 3: Clean up old dismissed notifications (weekly)
  cron.schedule('0 0 * * 0', async () => {
    console.log('Running notification cleanup job...');
    await cleanupOldNotifications();
  });

  console.log('Recommendation jobs initialized successfully');
}

/**
 * Generate recommendations for all active patients
 */
async function generateRecommendationsForAllPatients() {
  try {
    // Get all active patients
    const patients = await prisma.patients.findMany({
      select: { id: true, email: true },
    });

    console.log(`Processing ${patients.length} patients for recommendations...`);

    let successCount = 0;
    let errorCount = 0;

    for (const patient of patients) {
      try {
        // Generate recommendations
        const recommendations = await generateRecommendations(patient.id);

        // Create notifications for each recommendation
        for (const rec of recommendations) {
          try {
            await createNotification(patient.id, rec);
          } catch (error) {
            console.error(
              `Error creating notification for patient ${patient.id}:`,
              error
            );
            errorCount++;
          }
        }

        if (recommendations.length > 0) {
          successCount++;
          console.log(
            `Generated ${recommendations.length} recommendations for patient ${patient.email}`
          );
        }
      } catch (error) {
        console.error(
          `Error generating recommendations for patient ${patient.id}:`,
          error
        );
        errorCount++;
      }
    }

    console.log(
      `Recommendation job completed: ${successCount} patients processed, ${errorCount} errors`
    );
  } catch (error) {
    console.error('Error in recommendation job:', error);
  }
}

/**
 * Generate recommendations for a specific patient (on-demand)
 */
export async function generateRecommendationsForPatient(patientId) {
  try {
    console.log(`Generating recommendations for patient ${patientId}...`);
    const recommendations = await generateRecommendations(patientId);

    let createdCount = 0;
    for (const rec of recommendations) {
      try {
        await createNotification(patientId, rec);
        createdCount++;
      } catch (error) {
        console.error('Error creating notification:', error);
      }
    }

    console.log(
      `Generated ${recommendations.length} recommendations, created ${createdCount} notifications`
    );
    return {
      success: true,
      recommendationsGenerated: recommendations.length,
      notificationsCreated: createdCount,
    };
  } catch (error) {
    console.error('Error generating recommendations:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Clean up old dismissed notifications (older than 30 days)
 * Keep read but not dismissed notifications for reference
 */
async function cleanupOldNotifications() {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const result = await prisma.notifications.deleteMany({
      where: {
        dismissed_at: {
          lt: thirtyDaysAgo,
        },
      },
    });

    console.log(`Cleaned up ${result.count} old notifications`);
  } catch (error) {
    console.error('Error cleaning up notifications:', error);
  }
}

/**
 * Get statistics about notifications
 */
export async function getNotificationStats() {
  try {
    const [
      totalNotifications,
      unreadCount,
      typeBreakdown,
      priorityBreakdown,
    ] = await Promise.all([
      prisma.notifications.count(),
      prisma.notifications.count({
        where: {
          is_read: false,
          dismissed_at: null,
        },
      }),
      prisma.notifications.groupBy({
        by: ['notification_type'],
        _count: true,
      }),
      prisma.notifications.groupBy({
        by: ['priority'],
        _count: true,
      }),
    ]);

    return {
      totalNotifications,
      unreadCount,
      typeBreakdown,
      priorityBreakdown,
    };
  } catch (error) {
    console.error('Error getting notification stats:', error);
    return null;
  }
}

/**
 * Integration example for your main app file
 */
export const jobSchedulerExample = `
// In your main app initialization file (e.g., server.ts, app.js)
import { initRecommendationJobs } from '@/services/recommendationJobs';

// Initialize jobs when app starts
if (process.env.NODE_ENV === 'production') {
  initRecommendationJobs();
}
`;

/**
 * Manual testing function
 * Usage: node -e "import('./recommendationJobs.js').then(m => m.testRecommendations('patient-id'))"
 */
export async function testRecommendations(patientId) {
  console.log('Testing recommendation engine...');
  const result = await generateRecommendationsForPatient(patientId);
  console.log('Result:', result);

  const stats = await getNotificationStats();
  console.log('Notification Stats:', stats);
}
