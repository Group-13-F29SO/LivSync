import { NextResponse } from 'next/server';
import { generateRecommendations, createNotification } from '@/services/recommendationEngine';

/**
 * POST /api/patient/recommendations
 * Generate recommendations for a patient based on their biometric data
 * Returns the generated recommendations and creates notifications
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { patientId } = body;

    if (!patientId) {
      return NextResponse.json(
        { error: 'Patient ID is required' },
        { status: 400 }
      );
    }

    // Generate recommendations
    const recommendations = await generateRecommendations(patientId);

    // Create notifications for each recommendation
    const createdNotifications = [];
    for (const recommendation of recommendations) {
      try {
        const notification = await createNotification(patientId, recommendation);
        createdNotifications.push(notification);
      } catch (error) {
        console.error('Error creating notification:', error);
      }
    }

    return NextResponse.json(
      {
        success: true,
        recommendationsGenerated: recommendations.length,
        notificationsCreated: createdNotifications.length,
        recommendations: recommendations,
        notifications: createdNotifications,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error generating recommendations:', error);
    return NextResponse.json(
      { error: 'Failed to generate recommendations' },
      { status: 500 }
    );
  }
}
