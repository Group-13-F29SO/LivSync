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
    const verificationStatus = searchParams.get('verificationStatus'); // 'verified', 'unverified', or all

    const skip = (page - 1) * limit;

    // Build search and filter conditions
    const where = {};
    
    if (search) {
      where.OR = [
        { first_name: { contains: search, mode: 'insensitive' } },
        { last_name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { specialty: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (verificationStatus === 'verified') {
      where.is_verified = true;
    } else if (verificationStatus === 'unverified') {
      where.is_verified = false;
    }

    // Fetch providers with pagination
    const [providers, totalCount] = await Promise.all([
      prisma.providers.findMany({
        where,
        select: {
          id: true,
          first_name: true,
          last_name: true,
          email: true,
          specialty: true,
          is_verified: true,
          created_at: true,
          _count: {
            select: {
              patients: true,
            },
          },
        },
        orderBy: {
          [sortBy]: sortOrder === 'asc' ? 'asc' : 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.providers.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      providers: providers.map(p => ({
        id: p.id,
        firstName: p.first_name,
        lastName: p.last_name,
        email: p.email,
        specialty: p.specialty,
        isVerified: p.is_verified,
        createdAt: p.created_at,
        patientCount: p._count.patients,
      })),
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
      },
    });
  } catch (error) {
    console.error('Error fetching providers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch providers', details: error.message },
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
    const { action, providerId } = body;

    if (action === 'verify') {
      if (!providerId) {
        return NextResponse.json(
          { error: 'Provider ID is required' },
          { status: 400 }
        );
      }

      // Verify provider
      const provider = await prisma.providers.update({
        where: { id: providerId },
        data: { is_verified: true },
        select: {
          id: true,
          first_name: true,
          last_name: true,
          email: true,
          is_verified: true,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Provider verified successfully',
        provider: {
          id: provider.id,
          firstName: provider.first_name,
          lastName: provider.last_name,
          email: provider.email,
          isVerified: provider.is_verified,
        },
      });
    }

    if (action === 'unverify') {
      if (!providerId) {
        return NextResponse.json(
          { error: 'Provider ID is required' },
          { status: 400 }
        );
      }

      // Unverify provider
      const provider = await prisma.providers.update({
        where: { id: providerId },
        data: { is_verified: false },
        select: {
          id: true,
          first_name: true,
          last_name: true,
          email: true,
          is_verified: true,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Provider verification revoked',
        provider: {
          id: provider.id,
          firstName: provider.first_name,
          lastName: provider.last_name,
          email: provider.email,
          isVerified: provider.is_verified,
        },
      });
    }

    if (action === 'delete') {
      if (!providerId) {
        return NextResponse.json(
          { error: 'Provider ID is required' },
          { status: 400 }
        );
      }

      // Delete provider (cascades handled by prisma)
      await prisma.providers.delete({
        where: { id: providerId },
      });

      return NextResponse.json({
        success: true,
        message: 'Provider deleted successfully',
      });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error in provider POST request:', error);
    return NextResponse.json(
      { error: 'Failed to process request', details: error.message },
      { status: 500 }
    );
  }
}
