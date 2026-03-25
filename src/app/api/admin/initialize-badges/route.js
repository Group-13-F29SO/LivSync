/**
 * POST /api/admin/initialize-badges
 * Initialize default badge definitions in the database
 * Should only be called once during setup
 */

import { prisma } from '@/lib/prisma';
import { BADGE_DEFINITIONS } from '@/services/badgeDefinitions';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    // In a production app, you'd verify admin credentials here
    // For now, we'll just initialize the badges

    const initialized = [];
    const failed = [];

    for (const badgeDef of BADGE_DEFINITIONS) {
      try {
        // Check if badge already exists
        const existing = await prisma.achievements.findUnique({
          where: {
            name: badgeDef.name,
          },
        });

        if (!existing) {
          const achievement = await prisma.achievements.create({
            data: {
              name: badgeDef.name,
              description: badgeDef.description,
              icon_url: badgeDef.icon || null,
            },
          });

          initialized.push({
            id: achievement.id,
            name: achievement.name,
            status: 'created',
          });
        } else {
          initialized.push({
            id: existing.id,
            name: existing.name,
            status: 'already_exists',
          });
        }
      } catch (error) {
        failed.push({
          name: badgeDef.name,
          error: error.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Initialized ${initialized.length} badges`,
      data: {
        initialized,
        failed,
        total: BADGE_DEFINITIONS.length,
      },
    });
  } catch (error) {
    console.error('Error initializing badges:', error);
    return NextResponse.json(
      { success: false, error: 'Error initializing badges', details: error.message },
      { status: 500 }
    );
  }
}
