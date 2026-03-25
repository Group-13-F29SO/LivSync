import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

function getAuthenticatedUser(request) {
  const cookie = request.cookies.get('livsync_session');
  
  if (!cookie) {
    return null;
  }

  try {
    const session = JSON.parse(cookie.value);
    return session;
  } catch (error) {
    console.error('Failed to parse session cookie:', error);
    return null;
  }
}

// PATCH - Acknowledge a critical event
export async function PATCH(request, { params }) {
  try {
    const session = getAuthenticatedUser(request);
    if (!session || !session.userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;

    // Verify ownership
    const event = await prisma.critical_events.findUniqueOrThrow({
      where: { id },
    });

    if (event.patient_id !== session.userId) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const acknowledgedEvent = await prisma.critical_events.update({
      where: { id },
      data: {
        is_acknowledged: true,
        acknowledged_at: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: acknowledgedEvent.id,
        isAcknowledged: acknowledgedEvent.is_acknowledged,
        acknowledgedAt: acknowledgedEvent.acknowledged_at,
      },
    });
  } catch (error) {
    if (error.code === 'P2025') {
      return NextResponse.json(
        { success: false, error: 'Critical event not found' },
        { status: 404 }
      );
    }
    console.error('Error acknowledging critical event:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to acknowledge critical event' },
      { status: 500 }
    );
  }
}
