import bcrypt from 'bcrypt';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getIpFromRequest, getUserAgentFromRequest } from '@/lib/securityLogService';
import { trackFailedLoginAttempt, isAccountLocked, resetFailedLoginAttempts } from '@/lib/auth';

export async function POST(request) {
  try {
    const body = await request.json();
    const { username, password, twoFactorCode } = body;

    // Extract request info for logging
    const ipAddress = getIpFromRequest(request);
    const userAgent = getUserAgentFromRequest(request);

    // Validation
    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Check if account is locked
    if (isAccountLocked(username)) {
      await prisma.security_logs.create({
        data: {
          event_type: 'account_locked',
          user_email: username,
          user_type: 'patient',
          ip_address: ipAddress,
          user_agent: userAgent,
          message: 'Patient account locked due to multiple failed login attempts',
          severity: 'critical',
        },
      });

      return NextResponse.json(
        { error: 'Account locked due to multiple failed login attempts. Try again later.' },
        { status: 429 }
      );
    }

    // Find user by username
    const user = await prisma.patients.findUnique({
      where: { username },
    });

    if (!user) {
      trackFailedLoginAttempt(username);
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    // Verify password
    const passwordValid = await bcrypt.compare(password, user.password_hash);

    if (!passwordValid) {
      const attemptCount = trackFailedLoginAttempt(username);

      await prisma.security_logs.create({
        data: {
          event_type: 'login_failed',
          user_email: user.email,
          user_type: 'patient',
          ip_address: ipAddress,
          user_agent: userAgent,
          message: `Failed login attempt (Attempt ${attemptCount}/${3})`,
          severity: attemptCount >= 3 ? 'critical' : 'warning',
        },
      });

      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    // Check if 2FA is enabled
    if (user.two_factor_enabled) {
      // If 2FA code is not provided yet, ask for it
      if (!twoFactorCode) {
        return NextResponse.json(
          {
            requiresTwoFactor: true,
            userId: user.id,
            message: 'Two-factor authentication required',
          },
          { status: 202 } // 202 Accepted - more authentication required
        );
      }

      // Verify the 2FA code
      try {
        const verifyResponse = await fetch(
          `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/auth/verify-2fa`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              patientId: user.id,
              code: twoFactorCode,
            }),
          }
        );

        if (!verifyResponse.ok) {
          return NextResponse.json(
            { error: 'Invalid 2FA code' },
            { status: 401 }
          );
        }
      } catch (error) {
        console.error('2FA verification error:', error);
        return NextResponse.json(
          { error: 'Failed to verify 2FA code' },
          { status: 500 }
        );
      }
    }

    // Reset failed attempts on successful login
    resetFailedLoginAttempts(username);

    // Log successful login
    await prisma.security_logs.create({
      data: {
        event_type: 'login_success',
        user_email: user.email,
        user_type: 'patient',
        ip_address: ipAddress,
        user_agent: userAgent,
        message: `Patient user ${user.email} logged in successfully`,
        severity: 'info',
      },
    });

    // Login successful - return user data (without password)
    const response = NextResponse.json(
      {
        message: 'Login successful',
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          userType: 'patient',
        },
      },
      { status: 200 }
    );

    // Set secure session cookie
    response.cookies.set('livsync_session', JSON.stringify({
      userId: user.id,
      username: user.username,
      email: user.email,
      userType: 'patient',
    }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'An error occurred during login' },
      { status: 500 }
    );
  }
}
