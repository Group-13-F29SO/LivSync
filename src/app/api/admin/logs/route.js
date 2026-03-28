import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;
    const eventType = searchParams.get('eventType');
    const severity = searchParams.get('severity');
    const isRead = searchParams.get('isRead');

    const skip = (page - 1) * limit;
    const where = {};

    if (eventType) {
      where.event_type = eventType;
    }

    if (severity) {
      where.severity = severity;
    }

    if (isRead !== null && isRead !== undefined) {
      where.is_read = isRead === 'true';
    }

    const [logs, total] = await Promise.all([
      prisma.security_logs.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      prisma.security_logs.count({ where }),
    ]);

    return NextResponse.json(
      {
        logs,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching security logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch security logs' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      eventType,
      userEmail,
      userType,
      ipAddress,
      userAgent,
      message,
      severity = 'info',
      metadata,
    } = body;

    if (!eventType || !message) {
      return NextResponse.json(
        { error: 'eventType and message are required' },
        { status: 400 }
      );
    }

    const log = await prisma.security_logs.create({
      data: {
        event_type: eventType,
        user_email: userEmail,
        user_type: userType,
        ip_address: ipAddress,
        user_agent: userAgent,
        message,
        severity,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    });

    return NextResponse.json(
      { log, message: 'Security log created' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating security log:', error);
    return NextResponse.json(
      { error: 'Failed to create security log' },
      { status: 500 }
    );
  }
}
