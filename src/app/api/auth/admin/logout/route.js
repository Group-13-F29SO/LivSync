import { NextResponse } from 'next/server';
import { getIpFromRequest, getUserAgentFromRequest } from '@/lib/securityLogService';
import prisma from '@/lib/prisma';

export async function POST(request) {
  try {
    // Extract admin email from cookie if available
    const cookieHeader = request.headers.get('cookie');
    let adminEmail = 'Unknown';

    if (cookieHeader) {
      const cookies = cookieHeader.split(';');
      const sessionCookie = cookies.find(c => c.includes('livsync_admin_session'));
      if (sessionCookie) {
        try {
          const sessionData = JSON.parse(sessionCookie.split('=')[1]);
          adminEmail = sessionData.email || 'Unknown';
        } catch (e) {
          // Cookie parsing failed, continue with Unknown
        }
      }
    }

    // Extract request info for logging
    const ipAddress = getIpFromRequest(request);
    const userAgent = getUserAgentFromRequest(request);

    // Log logout
    await prisma.security_logs.create({
      data: {
        event_type: 'logout',
        user_email: adminEmail,
        user_type: 'admin',
        ip_address: ipAddress,
        user_agent: userAgent,
        message: `Admin user ${adminEmail} logged out`,
        severity: 'info',
      },
    });

    const response = NextResponse.json(
      { message: 'Admin logout successful' },
      { status: 200 }
    );

    // Clear the admin session cookie
    response.cookies.delete('livsync_admin_session');

    return response;
  } catch (error) {
    console.error('Admin logout error:', error);
    const response = NextResponse.json(
      { message: 'Admin logout successful' },
      { status: 200 }
    );
    response.cookies.delete('livsync_admin_session');
    return response;
  }
}
