import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import bcrypt from 'bcrypt';

/**
 * Hash the reset code for comparison
 * @param {string} code - The code to hash
 * @returns {string} Hashed code
 */
function hashResetCode(code) {
  return crypto.createHash('sha256').update(code).digest('hex');
}

/**
 * Validate password complexity
 * @param {string} password - Password to validate
 * @returns {Object} Validation result
 */
function validatePassword(password) {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  const isValid = password.length >= minLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar;
  
  const errors = [];
  if (password.length < minLength) errors.push(`Password must be at least ${minLength} characters`);
  if (!hasUpperCase) errors.push('Password must contain an uppercase letter');
  if (!hasLowerCase) errors.push('Password must contain a lowercase letter');
  if (!hasNumbers) errors.push('Password must contain a number');
  if (!hasSpecialChar) errors.push('Password must contain a special character');

  return { isValid, errors };
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, resetCode, newPassword, confirmPassword, userType = 'patient' } = body;

    // Validation
    if (!email || !resetCode || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: 'Passwords do not match' },
        { status: 400 }
      );
    }

    // Validate password complexity
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { 
          error: 'Password does not meet requirements',
          details: passwordValidation.errors,
        },
        { status: 400 }
      );
    }

    // Hash the provided code
    const hashedCode = hashResetCode(resetCode);

    // Find valid reset token
    const resetToken = await prisma.password_reset_tokens.findFirst({
      where: {
        email,
        user_type: userType,
        token: hashedCode,
        usedAt: null,
        expiresAt: {
          gt: new Date(), // Token not expired
        },
      },
    });

    if (!resetToken) {
      return NextResponse.json(
        { error: 'Invalid or expired reset code' },
        { status: 401 }
      );
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update password based on user type
    if (userType === 'patient') {
      await prisma.patients.update({
        where: { email },
        data: { password_hash: passwordHash },
      });
    } else if (userType === 'provider') {
      await prisma.providers.update({
        where: { email },
        data: { password_hash: passwordHash },
      });
    } else if (userType === 'admin') {
      await prisma.admins.update({
        where: { email },
        data: { password_hash: passwordHash },
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid user type' },
        { status: 400 }
      );
    }

    // Mark token as used
    await prisma.password_reset_tokens.update({
      where: { id: resetToken.id },
      data: { usedAt: new Date() },
    });

    return NextResponse.json(
      { 
        message: 'Password reset successfully',
        success: true,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { error: 'An error occurred while resetting your password' },
      { status: 500 }
    );
  }
}
