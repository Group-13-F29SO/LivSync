/**
 * POST /api/admin/cleanup-invalid-badges
 * Clean up badges that no longer meet criteria for a specific user or all users
 * This is a manual cleanup endpoint for admin use
 */

import { prisma } from '@/lib/prisma';
import { cleanupInvalidAchievements } from '@/services/badgeEarner';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const { patientId } = body;

    if (!patientId) {
      return NextResponse.json(
        { success: false, error: 'patientId is required' },
        { status: 400 }
      );
    }

    // Verify patient exists
    const patient = await prisma.patients.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      return NextResponse.json(
        { success: false, error: 'Patient not found' },
        { status: 404 }
      );
    }

    // Clean up invalid achievements
    const cleanedCount = await cleanupInvalidAchievements(patientId);

    return NextResponse.json({
      success: true,
      message: `Cleaned up ${cleanedCount} invalid badge(s) for patient`,
      data: {
        patientId,
        cleanedCount,
      },
    });
  } catch (error) {
    console.error('Error in cleanup endpoint:', error);
    return NextResponse.json(
      { success: false, error: 'Error cleaning up badges', details: error.message },
      { status: 500 }
    );
  }
}
