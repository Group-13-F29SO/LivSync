import { NextResponse } from 'next/server';
import { markNotificationAsRead } from '@/services/recommendationEngine';

/**
 * POST /api/patient/notifications/mark-read
 * Mark a notification as read
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

    const notification = await markNotificationAsRead(notificationId);

    return NextResponse.json(
      {
        success: true,
        notification: notification,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark notification as read' },
      { status: 500 }
    );
  }
}
