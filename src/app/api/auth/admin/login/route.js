import { authenticateAdmin, trackFailedLoginAttempt, isAccountLocked, resetFailedLoginAttempts } from '@/lib/auth';
import { NextResponse } from 'next/server';
import { getIpFromRequest, getUserAgentFromRequest } from '@/lib/securityLogService';
import prisma from '@/lib/prisma';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Extract request info for logging
    const ipAddress = getIpFromRequest(request);
    const userAgent = getUserAgentFromRequest(request);

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Check if account is locked
    if (isAccountLocked(email)) {
      // Log the lock warning
      await prisma.security_logs.create({
        data: {
          event_type: 'account_locked',
          user_email: email,
          user_type: 'admin',
          ip_address: ipAddress,
          user_agent: userAgent,
          message: 'Admin account locked due to multiple failed login attempts',
          severity: 'critical',
        },
      });

      return NextResponse.json(
        { error: 'Account locked due to multiple failed login attempts. Try again later.' },
        { status: 429 }
      );
    }

    // Authenticate admin
    const admin = await authenticateAdmin(email, password);

    if (!admin) {
      const attemptCount = trackFailedLoginAttempt(email);

      // Log failed login attempt
      await prisma.security_logs.create({
        data: {
          event_type: 'login_failed',
          user_email: email,
          user_type: 'admin',
          ip_address: ipAddress,
          user_agent: userAgent,
          message: `Failed login attempt (Attempt ${attemptCount}/${3})`,
          severity: attemptCount >= 3 ? 'critical' : 'warning',
        },
      });

      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Reset failed attempts on successful login
    resetFailedLoginAttempts(email);

    // Log successful login
    await prisma.security_logs.create({
      data: {
        event_type: 'login_success',
        user_email: email,
        user_type: 'admin',
        ip_address: ipAddress,
        user_agent: userAgent,
        message: `Admin user ${email} logged in successfully`,
        severity: 'info',
      },
    });

    // Login successful - return admin data
    const response = NextResponse.json(
      {
        message: 'Admin login successful',
        user: {
          id: admin.id,
          email: admin.email,
          username: admin.username,
          role: admin.role,
        },
      },
      { status: 200 }
    );

    // Set secure admin session cookie
    response.cookies.set('livsync_admin_session', JSON.stringify({
      userId: admin.id,
      email: admin.email,
      username: admin.username,
      role: 'admin',
    }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 8, // 8 hours (shorter than regular users)
    });

    return response;
  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json(
      { error: 'An error occurred during admin login' },
      { status: 500 }
    );
  }
}
