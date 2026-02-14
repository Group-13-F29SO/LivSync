import bcrypt from 'bcrypt';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validation for provider
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find provider by email
    const provider = await prisma.providers.findUnique({
      where: { email },
    });

    if (!provider) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Verify password
    const passwordValid = await bcrypt.compare(password, provider.password_hash);

    if (!passwordValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Check if provider is approved by admin
    if (!provider.is_verified) {
      return NextResponse.json(
        { 
          error: 'Your provider account is pending admin approval. You will be able to login once an administrator approves your account.',
          status: 'pending_approval'
        },
        { status: 403 }
      );
    }

    // Login successful - return provider data
    const response = NextResponse.json(
      {
        message: 'Provider login successful',
        user: {
          id: provider.id,
          email: provider.email,
          firstName: provider.first_name,
          lastName: provider.last_name,
          specialty: provider.specialty,
          userType: 'provider',
        },
      },
      { status: 200 }
    );

    // Set secure session cookie for provider
    response.cookies.set('livsync_session', JSON.stringify({
      userId: provider.id,
      email: provider.email,
      userType: 'provider',
    }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    console.error('Provider login error:', error);
    return NextResponse.json(
      { error: 'An error occurred during login' },
      { status: 500 }
    );
  }
}
