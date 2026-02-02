import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

// Helper function to verify admin session
function verifyAdminSession(request) {
  try {
    const sessionCookie = request.cookies.get('livsync_admin_session');
    
    if (!sessionCookie) {
      return null;
    }

    const session = JSON.parse(sessionCookie.value);
    
    if (session.role !== 'admin') {
      return null;
    }

    return session;
  } catch (error) {
    return null;
  }
}

export async function GET(request) {
  try {
    const session = verifyAdminSession(request);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get query parameters for filtering and sorting
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const skip = (page - 1) * limit;

    // Build search filter
    const where = search
      ? {
          OR: [
            { first_name: { contains: search, mode: 'insensitive' } },
            { last_name: { contains: search, mode: 'insensitive' } },
            { username: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {};

    // Fetch patients with pagination
    const [patients, totalCount] = await Promise.all([
      prisma.patients.findMany({
        where,
        select: {
          id: true,
          first_name: true,
          last_name: true,
          username: true,
          email: true,
          profile_picture_url: true,
          provider_id: true,
          provider_consent_status: true,
          created_at: true,
          updated_at: true,
          _count: {
            select: {
              biometric_data: true,
              goals: true,
              devices: true,
            },
          },
        },
        orderBy: {
          [sortBy]: sortOrder === 'asc' ? 'asc' : 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.patients.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      patients: patients.map(p => ({
        id: p.id,
        firstName: p.first_name,
        lastName: p.last_name,
        username: p.username,
        email: p.email,
        profilePictureUrl: p.profile_picture_url,
        providerId: p.provider_id,
        providerConsentStatus: p.provider_consent_status,
        createdAt: p.created_at,
        updatedAt: p.updated_at,
        biometricDataCount: p._count.biometric_data,
        goalsCount: p._count.goals,
        devicesCount: p._count.devices,
      })),
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
      },
    });
  } catch (error) {
    console.error('Error fetching patients:', error);
    return NextResponse.json(
      { error: 'Failed to fetch patients', details: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const session = verifyAdminSession(request);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, patientId } = body;

    if (action === 'delete') {
      if (!patientId) {
        return NextResponse.json(
          { error: 'Patient ID is required' },
          { status: 400 }
        );
      }

      // Delete patient and all related data (cascades handled by prisma)
      await prisma.patients.delete({
        where: { id: patientId },
      });

      return NextResponse.json({
        success: true,
        message: 'Patient deleted successfully',
      });
    }

    if (action === 'deactivate') {
      if (!patientId) {
        return NextResponse.json(
          { error: 'Patient ID is required' },
          { status: 400 }
        );
      }

      // Update patient to mark as inactive (using updated_at as indicator)
      const patient = await prisma.patients.update({
        where: { id: patientId },
        data: {
          updated_at: new Date(),
        },
        select: {
          id: true,
          first_name: true,
          last_name: true,
          email: true,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Patient deactivated successfully',
        patient,
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error in patient POST request:', error);
    return NextResponse.json(
      { error: 'Failed to process request', details: error.message },
      { status: 500 }
    );
  }
}
