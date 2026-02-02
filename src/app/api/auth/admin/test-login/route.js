import bcrypt from 'bcrypt';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const testEmail = 'admin@livsync.com';
    const testPassword = 'admin123';

    // Check if test admin already exists
    let admin = await prisma.admins.findUnique({
      where: { email: testEmail },
    });

    // If doesn't exist, create it
    if (!admin) {
      const passwordHash = await bcrypt.hash(testPassword, 10);
      
      admin = await prisma.admins.create({
        data: {
          username: 'testadmin',
          email: testEmail,
          password_hash: passwordHash,
        },
      });

      console.log('Test admin created successfully');
    }

    // Now authenticate
    const isValid = await bcrypt.compare(testPassword, admin.password_hash);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      );
    }

    // Login successful - return admin data
    const response = NextResponse.json(
      {
        message: 'Test admin login successful',
        user: {
          id: admin.id,
          email: admin.email,
          username: admin.username,
          role: 'admin',
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
      maxAge: 60 * 60 * 8, // 8 hours
    });

    return response;
  } catch (error) {
    console.error('Test admin login error:', error);
    return NextResponse.json(
      { error: 'An error occurred during test login' },
      { status: 500 }
    );
  }
}
