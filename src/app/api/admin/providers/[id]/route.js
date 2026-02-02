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

export async function GET(request, { params }) {
  try {
    const session = verifyAdminSession(request);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = params;

    // Fetch provider with all related data
    const provider = await prisma.providers.findUnique({
      where: { id },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        specialty: true,
        is_verified: true,
        created_at: true,
        patients: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            username: true,
            email: true,
            provider_consent_status: true,
            created_at: true,
            _count: {
              select: {
                biometric_data: true,
                goals: true,
              },
            },
          },
          orderBy: {
            created_at: 'desc',
          },
        },
      },
    });

    if (!provider) {
      return NextResponse.json(
        { error: 'Provider not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      provider: {
        id: provider.id,
        firstName: provider.first_name,
        lastName: provider.last_name,
        email: provider.email,
        specialty: provider.specialty,
        isVerified: provider.is_verified,
        createdAt: provider.created_at,
        patientCount: provider.patients.length,
        patients: provider.patients.map(p => ({
          id: p.id,
          firstName: p.first_name,
          lastName: p.last_name,
          username: p.username,
          email: p.email,
          providerConsentStatus: p.provider_consent_status,
          createdAt: p.created_at,
          biometricDataCount: p._count.biometric_data,
          goalsCount: p._count.goals,
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching provider details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch provider details', details: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const session = verifyAdminSession(request);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = params;
    const body = await request.json();

    // Check if provider exists
    const existingProvider = await prisma.providers.findUnique({
      where: { id },
    });

    if (!existingProvider) {
      return NextResponse.json(
        { error: 'Provider not found' },
        { status: 404 }
      );
    }

    // Update provider data
    const updateData = {};
    if (body.first_name) updateData.first_name = body.first_name;
    if (body.last_name) updateData.last_name = body.last_name;
    if (body.specialty) updateData.specialty = body.specialty;
    if (body.is_verified !== undefined) updateData.is_verified = body.is_verified;

    const updatedProvider = await prisma.providers.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        specialty: true,
        is_verified: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Provider updated successfully',
      provider: {
        id: updatedProvider.id,
        firstName: updatedProvider.first_name,
        lastName: updatedProvider.last_name,
        email: updatedProvider.email,
        specialty: updatedProvider.specialty,
        isVerified: updatedProvider.is_verified,
      },
    });
  } catch (error) {
    console.error('Error updating provider:', error);
    return NextResponse.json(
      { error: 'Failed to update provider', details: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = verifyAdminSession(request);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = params;

    // Delete provider (cascades to related data)
    await prisma.providers.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Provider deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting provider:', error);
    return NextResponse.json(
      { error: 'Failed to delete provider', details: error.message },
      { status: 500 }
    );
  }
}
