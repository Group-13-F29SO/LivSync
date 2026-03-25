/**
 * POST /api/patient/check-badges
 * Check all badges for a user and award any newly met badges
 * Also creates celebratory notifications for newly earned badges
 */

import { prisma } from '@/lib/prisma';
import { checkAndAwardNewBadges } from '@/services/badgeEarner';
import { NextResponse } from 'next/server';

/**
 * Check if user is authenticated via session cookie
 */
function getAuthenticatedUser(request) {
  const cookie = request.cookies.get('livsync_session');

  if (!cookie) {
    return null;
  }

  try {
    const session = JSON.parse(cookie.value);
    return session;
  } catch (error) {
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

    // Check for new badges
    const newBadges = await checkAndAwardNewBadges(patientId);

    // Create notifications for newly earned badges
    const notifications = [];
    for (const badgeInfo of newBadges) {
      if (badgeInfo.awarded) {
        try {
          const notification = await prisma.notifications.create({
            data: {
              patient_id: patientId,
              title: '🎉 Badge Unlocked!',
              message: `Congratulations! You've earned the "${badgeInfo.badgeName}" badge!`,
              notification_type: 'badge_earned',
              priority: 'high',
              action_type: 'view_badge',
              action_data: JSON.stringify({ badgeId: badgeInfo.badgeId }),
            },
          });
          notifications.push({
            badgeId: badgeInfo.badgeId,
            notificationId: notification.id,
          });
        } catch (error) {
          console.error(`Error creating notification for badge ${badgeInfo.badgeId}:`, error);
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        newBadges: newBadges.filter((b) => b.awarded),
        notifications,
        message: `Found ${newBadges.filter((b) => b.awarded).length} new badge(s)`,
      },
    });
  } catch (error) {
    console.error('Error checking badges:', error);
    return NextResponse.json(
      { success: false, error: 'Error checking badges' },
      { status: 500 }
    );
  }
}
