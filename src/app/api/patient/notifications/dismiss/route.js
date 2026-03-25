import { NextResponse } from 'next/server';
import { dismissNotification } from '@/services/recommendationEngine';

/**
 * POST /api/patient/notifications/dismiss
 * Dismiss a notification
 * Body:
 *   notificationId: required
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { notificationId } = body;

    if (!notificationId) {
      return NextResponse.json(
        { error: 'Notification ID is required' },
        { status: 400 }
      );
    }

    const notification = await dismissNotification(notificationId);

    return NextResponse.json(
      {
        success: true,
        notification: notification,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error dismissing notification:', error);
    return NextResponse.json(
      { error: 'Failed to dismiss notification' },
      { status: 500 }
    );
  }
}
