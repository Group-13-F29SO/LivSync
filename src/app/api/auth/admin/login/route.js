import { authenticateAdmin } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Authenticate admin
    const admin = await authenticateAdmin(email, password);

    if (!admin) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

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
