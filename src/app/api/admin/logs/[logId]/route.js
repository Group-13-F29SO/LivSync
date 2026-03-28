import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PATCH(request, { params }) {
  try {
    const { logId } = params;

    if (!logId) {
      return NextResponse.json(
        { error: 'logId is required' },
        { status: 400 }
      );
    }

    const log = await prisma.security_logs.update({
      where: { id: logId },
      data: {
        is_read: true,
        read_at: new Date(),
      },
    });

    return NextResponse.json(
      { log, message: 'Log marked as read' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating security log:', error);
    return NextResponse.json(
      { error: 'Failed to update security log' },
      { status: 500 }
    );
  }
}
