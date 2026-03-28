import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const providerId = searchParams.get('providerId');

    // Validation
    if (!providerId) {
      return NextResponse.json(
        { error: 'Provider ID is required' },
        { status: 400 }
      );
    }

    // Get the provider from session to verify authorization
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('livsync_session');
    
    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    let session;
    try {
      session = JSON.parse(sessionCookie.value);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      );
    }

    // Verify that the providerId matches the session user
    if (session.userId !== providerId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch notifications from the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const notifications = await prisma.notifications.findMany({
      where: {
        provider_id: providerId,
        created_at: {
          gte: sevenDaysAgo,
        },
      },
      orderBy: {
        created_at: 'desc',
      },
      take: 20,
    });

    // Format notifications
    const formattedNotifications = notifications.map(notif => {
      let type = 'critical_event';
      let title = 'Critical Event';
      let message = notif.message || 'A critical event occurred';

      if (notif.notification_type === 'connection_accepted') {
        type = 'connection_accepted';
        title = 'Connection Accepted';
        message = notif.message || 'A patient accepted your connection request';
      } else if (notif.notification_type === 'alert' || notif.action_type === 'critical_event') {
        type = 'critical_event';
        title = 'Critical Event Alert';
        message = notif.message || 'A patient has a critical event';
      }

      return {
        id: notif.id,
        type,
        title,
        message,
        timestamp: formatTimestamp(notif.created_at),
        createdAt: notif.created_at,
      };
    });

    // Count unread notifications (created in the last day)
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const unreadCount = formattedNotifications.filter(
      n => new Date(n.createdAt) > oneDayAgo
    ).length;

    return NextResponse.json({
      notifications: formattedNotifications,
      unreadCount,
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

function formatTimestamp(date) {
  const now = new Date();
  const diff = now - new Date(date);
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  return new Date(date).toLocaleDateString();
}
