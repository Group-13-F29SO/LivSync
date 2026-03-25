/**
 * GET /api/patient/achievements
 * Retrieve all achievements/badges for the authenticated user
 */

import { prisma } from '@/lib/prisma';
import { getUserBadgesWithStatus, cleanupInvalidAchievements } from '@/services/badgeEarner';
import { getAllBadgesGroupedByCategory } from '@/services/badgeDefinitions';
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

export async function GET(request) {
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

    // Clean up any invalid achievements before returning
    try {
      await cleanupInvalidAchievements(patientId);
    } catch (error) {
      console.error('Error cleaning up achievements:', error);
      // Don't fail the request if cleanup fails
    }

    // Get all badges with earned status
    const allBadges = await getUserBadgesWithStatus(patientId);

    // Group by category
    const grouped = {};
    allBadges.forEach((badge) => {
      if (!grouped[badge.category]) {
        grouped[badge.category] = [];
      }
      grouped[badge.category].push({
        id: badge.id,
        name: badge.name,
        description: badge.description,
        icon: badge.icon,
        status: badge.status,
        earnedDate: badge.earnedDate,
      });
    });

    // Sort categories and badges
    const sortedGroups = Object.keys(grouped)
      .sort()
      .reduce((acc, category) => {
        acc[category] = grouped[category].sort((a, b) => a.name.localeCompare(b.name));
        return acc;
      }, {});

    // Calculate stats
    const totalBadges = allBadges.length;
    const earnedCount = allBadges.filter((b) => b.status === 'earned').length;

    return NextResponse.json({
      success: true,
      data: {
        badges: sortedGroups,
        stats: {
          total: totalBadges,
          earned: earnedCount,
          locked: totalBadges - earnedCount,
          progressPercentage: Math.round((earnedCount / totalBadges) * 100),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching achievements:', error);
    return NextResponse.json(
      { success: false, error: 'Error fetching achievements' },
      { status: 500 }
    );
  }
}
