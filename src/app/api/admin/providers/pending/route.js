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
 * GET /api/admin/providers/pending
 * 
 * Retrieves all providers pending admin approval.
 * 
 * Query Parameters:
 * - page: Page number for pagination (default: 1)
 * - limit: Number of results per page (default: 20)
 * - sortBy: Field to sort by (default: 'created_at')
 * - sortOrder: Sort order 'asc' or 'desc' (default: 'desc')
 * - search: Search by first_name, last_name, email, or specialty
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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;
    const search = searchParams.get('search') || '';
    let sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Validate sortBy to prevent invalid field names
    const validSortFields = ['id', 'first_name', 'last_name', 'email', 'specialty', 'created_at'];
    if (!validSortFields.includes(sortBy)) {
      sortBy = 'created_at';
    }

    const skip = (page - 1) * limit;

    // Build search conditions
    const where = {
      is_verified: false, // Only pending providers
    };
    
    if (search) {
      where.OR = [
        { first_name: { contains: search, mode: 'insensitive' } },
        { last_name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { specialty: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Build orderBy object safely
    const orderBy = {};
    orderBy[sortBy] = sortOrder === 'asc' ? 'asc' : 'desc';

    // Fetch pending providers with pagination
    let providers;
    try {
      providers = await prisma.providers.findMany({
        where,
        select: {
          id: true,
          first_name: true,
          last_name: true,
          email: true,
          specialty: true,
          medical_license_number: true,
          workplace_name: true,
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
    } catch (dbError) {
      console.error('Prisma query error:', dbError);
      throw new Error(`Database query failed: ${dbError.message}`);
    }

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
          medicalLicenseNumber: p.medical_license_number,
          workplaceName: p.workplace_name,
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
    console.error('Error fetching pending providers:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch pending providers',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/providers/pending
 * 
 * Approve a pending provider account.
 * 
 * Request Body:
 * {
 *   providerId: "uuid",
 *   action: "approve" (required)
 * }
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
    const { providerId, action } = body;

    if (!providerId || !action) {
      return NextResponse.json(
        { error: 'Provider ID and action are required' },
        { status: 400 }
      );
    }

    if (action !== 'approve') {
      return NextResponse.json(
        { error: 'Invalid action. Only "approve" is allowed on this endpoint.' },
        { status: 400 }
      );
    }

    // Check if provider exists and is pending
    const provider = await prisma.providers.findUnique({
      where: { id: providerId },
    });

    if (!provider) {
      return NextResponse.json(
        { error: 'Provider not found' },
        { status: 404 }
      );
    }

    if (provider.is_verified) {
      return NextResponse.json(
        { error: 'Provider is already approved' },
        { status: 400 }
      );
    }

    // Approve provider
    const approvedProvider = await prisma.providers.update({
      where: { id: providerId },
      data: { is_verified: true },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        specialty: true,
        is_verified: true,
        created_at: true,
      },
    });

    return NextResponse.json({
      status: 'success',
      message: 'Provider approved successfully',
      data: {
        provider: {
          id: approvedProvider.id,
          firstName: approvedProvider.first_name,
          lastName: approvedProvider.last_name,
          email: approvedProvider.email,
          specialty: approvedProvider.specialty,
          isVerified: approvedProvider.is_verified,
          createdAt: approvedProvider.created_at,
        },
      },
    });
  } catch (error) {
    console.error('Error approving provider:', error);
    return NextResponse.json(
      { 
        error: 'Failed to approve provider',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
