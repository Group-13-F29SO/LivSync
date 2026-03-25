import { NextResponse } from 'next/server';
import { getUnreadNotifications, getAllNotifications } from '@/services/recommendationEngine';

/**
 * GET /api/patient/notifications
 * Fetch notifications for a patient
 * Query params:
 *   patientId: required
 *   unreadOnly: boolean to get only unread notifications (default: true)
 *   limit: number of notifications to return (default: 10)
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');
    const unreadOnly = searchParams.get('unreadOnly') !== 'false';
    const limit = Math.min(parseInt(searchParams.get('limit')) || 10, 100);

    if (!patientId) {
      return NextResponse.json(
        { error: 'Patient ID is required' },
        { status: 400 }
      );
    }

    let notifications;
    if (unreadOnly) {
      notifications = await getUnreadNotifications(patientId, limit);
    } else {
      notifications = await getAllNotifications(patientId, limit);
    }

    return NextResponse.json(
      {
        success: true,
        count: notifications.length,
        notifications: notifications,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}
