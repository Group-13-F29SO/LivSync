import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import crypto from 'crypto';

/**
 * Hash the reset code for comparison
 * @param {string} code - The code to hash
 * @returns {string} Hashed code
 */
function hashResetCode(code) {
  return crypto.createHash('sha256').update(code).digest('hex');
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, resetCode, userType = 'patient' } = body;

    // Validation
    if (!email || !resetCode) {
      return NextResponse.json(
        { error: 'Email and reset code are required' },
        { status: 400 }
      );
    }

    if (resetCode.length !== 6 || isNaN(resetCode)) {
      return NextResponse.json(
        { error: 'Invalid reset code format' },
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

    return NextResponse.json(
      { 
        message: 'Reset code verified successfully',
        tokenId: resetToken.id,
        verified: true,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Verify reset token error:', error);
    return NextResponse.json(
      { error: 'An error occurred while verifying the code' },
      { status: 500 }
    );
  }
}
