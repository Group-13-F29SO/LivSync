import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    // Verify admin session
    const sessionCookie = request.cookies.get('livsync_admin_session');
    
    if (!sessionCookie) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const session = JSON.parse(sessionCookie.value);
    
    if (session.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Fetch all patients
    const patients = await prisma.patients.findMany({
      select: {
        id: true,
        first_name: true,
        last_name: true,
        username: true,
        email: true,
        created_at: true,
        provider_consent_status: true,
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    return NextResponse.json({
      patients: patients.map(p => ({
        id: p.id,
        firstName: p.first_name,
        lastName: p.last_name,
        username: p.username,
        email: p.email,
        createdAt: p.created_at,
        providerConsentStatus: p.provider_consent_status,
      })),
    });
  } catch (error) {
    console.error('Error fetching patients:', error);
    return NextResponse.json(
      { error: 'Failed to fetch patients' },
      { status: 500 }
    );
  }
}
