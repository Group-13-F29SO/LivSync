import { prisma } from '@/lib/prisma';
import { sendPasswordResetEmail } from '@/lib/emailService';
import { NextResponse } from 'next/server';
import crypto from 'crypto';

/**
 * Generate a 6-digit verification code
 * @returns {string} 6-digit code
 */
function generateResetCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Hash the reset code for storage
 * @param {string} code - The code to hash
 * @returns {string} Hashed code
 */
function hashResetCode(code) {
  return crypto.createHash('sha256').update(code).digest('hex');
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, userType = 'patient' } = body;

    // Validation
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Check if user exists based on user type
    let user = null;
    
    if (userType === 'patient') {
      user = await prisma.patients.findUnique({
        where: { email },
      });
    } else if (userType === 'provider') {
      user = await prisma.providers.findUnique({
        where: { email },
      });
    } else if (userType === 'admin') {
      user = await prisma.admins.findUnique({
        where: { email },
      });
    }

    if (!user) {
      // Don't reveal whether email exists for security
      return NextResponse.json(
        { message: 'If this email exists, a password reset link has been sent' },
        { status: 200 }
      );
    }

    // Generate reset code and hash it
    const resetCode = generateResetCode();
    const hashedCode = hashResetCode(resetCode);

    // Set expiration to 30 minutes from now
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    // Delete any existing reset tokens for this email
    await prisma.password_reset_tokens.deleteMany({
      where: {
        email,
        usedAt: null,
      },
    });

    // Create new reset token
    await prisma.password_reset_tokens.create({
      data: {
        email,
        user_type: userType,
        token: hashedCode,
        expiresAt,
      },
    });

    // Send email with reset code
    const userName = userType === 'patient' 
      ? user.first_name 
      : (userType === 'provider' ? user.first_name : user.username);

    const emailSent = await sendPasswordResetEmail(email, resetCode, userName);

    if (!emailSent) {
      return NextResponse.json(
        { error: 'Failed to send reset email. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        message: 'Password reset email sent successfully',
        requiresVerification: true,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'An error occurred while processing your request' },
      { status: 500 }
    );
  }
}
