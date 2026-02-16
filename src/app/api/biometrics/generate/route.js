/**
 * POST /api/biometrics/generate
 * Generate simulated biometric data for authenticated user
 */

import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import BiometricDataGenerator from '@/services/biometricGenerator';

/**
 * Check if user is authenticated via session cookie
 */
function getAuthenticatedUser(request) {
  const cookie = request.cookies.get('livsync_session');
  
  if (!cookie) {
    console.log('No session cookie found');
    return null;
  }

  try {
    const session = JSON.parse(cookie.value);
    console.log('Session parsed:', { 
      hasUserId: !!session.userId, 
      userIdType: typeof session.userId,
      userId: session.userId 
    });
    return session;
  } catch (error) {
    console.error('Failed to parse session cookie:', error);
    return null;
  }
}

export async function POST(request) {
  try {
    // Authenticate user
    const session = getAuthenticatedUser(request);
    
    if (!session || !session.userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const patientId = session.userId;

    // Parse request body
    let date = new Date();
    try {
      const body = await request.json();
      if (body.date) {
        const parsedDate = new Date(body.date);
        if (!isNaN(parsedDate.getTime())) {
          date = parsedDate;
        }
      }
    } catch (e) {
      // Request body is optional, use default date
    }

    // Normalize date to midnight
    date.setHours(0, 0, 0, 0);

    // Validate patient exists
    const patient = await prisma.patients.findUnique({
      where: { id: patientId }
    });

    if (!patient) {
      console.error('Patient not found in database:', { 
        patientId,
        patientIdType: typeof patientId 
      });
      return NextResponse.json(
        { success: false, error: 'Patient not found in database. Please ensure you are logged in correctly.' },
        { status: 404 }
      );
    }

    // Create generator and generate data
    const generator = new BiometricDataGenerator(prisma);
    const result = await generator.generate(patientId, date);

    // Return success response
    return NextResponse.json(
      {
        success: true,
        message: 'Data generated successfully',
        data: result
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Biometrics generation error:', error);

    // Determine error type and respond accordingly
    if (error.message.includes('validation')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Data validation failed: ' + error.message
        },
        { status: 400 }
      );
    }

    if (error.message.includes('database')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Database error. Please try again later.'
        },
        { status: 500 }
      );
    }

    // Generic error response
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'An unexpected error occurred during data generation'
      },
      { status: 500 }
    );
  }
}
