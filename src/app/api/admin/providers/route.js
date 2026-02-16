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

/**
 * GET /api/admin/providers
 * 
 * Retrieves all providers with filtering and pagination.
 * 
 * Query Parameters:
 * - page: Page number for pagination (default: 1)
 * - limit: Number of results per page (default: 20)
 * - search: Search by first_name, last_name, email, or specialty
 * - sortBy: Field to sort by (default: 'created_at')
 * - sortOrder: Sort order 'asc' or 'desc' (default: 'desc')
 * - verificationStatus: Filter by status ('approved', 'pending', or all)
 * 
 * Example: GET /api/admin/providers?verificationStatus=pending&limit=50
 */
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
    let sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const approvalStatus = searchParams.get('verificationStatus') || searchParams.get('approvalStatus');

    // Validate sortBy to prevent invalid field names
    const validSortFields = ['id', 'first_name', 'last_name', 'email', 'specialty', 'created_at'];
    if (!validSortFields.includes(sortBy)) {
      sortBy = 'created_at';
    }

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

    // Support both old (verified/unverified) and new (approved/pending) naming
    if (approvalStatus === 'approved' || approvalStatus === 'verified') {
      where.is_verified = true;
    } else if (approvalStatus === 'pending' || approvalStatus === 'unverified') {
      where.is_verified = false;
    }

    // Build orderBy object safely
    const orderBy = {};
    orderBy[sortBy] = sortOrder === 'asc' ? 'asc' : 'desc';

    // Fetch providers with pagination
    const providers = await prisma.providers.findMany({
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
      orderBy,
      skip,
      take: limit,
    });

    const totalCount = await prisma.providers.count({ where });
    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      status: 'success',
      data: {
        providers: providers.map(p => ({
          id: p.id,
          firstName: p.first_name,
          lastName: p.last_name,
          email: p.email,
          specialty: p.specialty,
          approvalStatus: p.is_verified ? 'approved' : 'pending',
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

/**
 * POST /api/admin/providers
 * 
 * Actions:
 * - approve: Approve a pending provider account
 * - reject: Reject (delete) a pending provider account
 * - revoke: Revoke approval from an approved provider
 * - delete: Delete a provider account
 */
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

    if (!providerId) {
      return NextResponse.json(
        { error: 'Provider ID is required' },
        { status: 400 }
      );
    }

    // Check if provider exists
    const provider = await prisma.providers.findUnique({
      where: { id: providerId },
    });

    if (!provider) {
      return NextResponse.json(
        { error: 'Provider not found' },
        { status: 404 }
      );
    }

    // Approve pending provider
    if (action === 'approve' || action === 'verify') {
      if (provider.is_verified) {
        return NextResponse.json(
          { error: 'Provider is already approved' },
          { status: 400 }
        );
      }

      const approvedProvider = await prisma.providers.update({
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
        message: 'Provider approved successfully. They can now login.',
        provider: {
          id: approvedProvider.id,
          firstName: approvedProvider.first_name,
          lastName: approvedProvider.last_name,
          email: approvedProvider.email,
          isVerified: approvedProvider.is_verified,
        },
      });
    }

    // Reject (delete) pending provider
    if (action === 'reject') {
      if (provider.is_verified) {
        return NextResponse.json(
          { error: 'Cannot reject an already approved provider. Use "revoke" first to revoke approval.' },
          { status: 400 }
        );
      }

      await prisma.providers.delete({
        where: { id: providerId },
      });

      return NextResponse.json({
        success: true,
        message: 'Provider account rejected and deleted',
      });
    }

    // Revoke approval from approved provider
    if (action === 'revoke' || action === 'unverify') {
      if (!provider.is_verified) {
        return NextResponse.json(
          { error: 'Provider is not approved yet' },
          { status: 400 }
        );
      }

      const revokedProvider = await prisma.providers.update({
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
        message: 'Provider approval revoked. They can no longer login.',
        provider: {
          id: revokedProvider.id,
          firstName: revokedProvider.first_name,
          lastName: revokedProvider.last_name,
          email: revokedProvider.email,
          isVerified: revokedProvider.is_verified,
        },
      });
    }

    // Delete provider account
    if (action === 'delete') {
      await prisma.providers.delete({
        where: { id: providerId },
      });

      return NextResponse.json({
        success: true,
        message: 'Provider account deleted successfully',
      });
    }

    return NextResponse.json(
      { error: 'Invalid action. Allowed actions: approve, reject, revoke, delete' },
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
