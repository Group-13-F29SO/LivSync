/**
 * Articles API Routes
 * GET: Fetch all articles with pagination and filtering
 * POST: Create a new article (admin only)
 */

import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

/**
 * Check if user is authenticated as admin
 */
function getAdminSession(request) {
  const cookie = request.cookies.get('livsync_admin_session');
  
  if (!cookie) {
    return null;
  }

  try {
    const session = JSON.parse(cookie.value);
    return session;
  } catch (error) {
    return null;
  }
}

/**
 * GET /api/articles
 * Fetch all articles with optional filtering and pagination
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const skip = (page - 1) * limit;

    // Build query filters
    const where = {};
    if (category) {
      where.category = category;
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Fetch articles
    const [articles, total] = await Promise.all([
      prisma.articles.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      prisma.articles.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data: {
        articles,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching articles:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch articles' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/articles
 * Create a new article (admin only)
 */
export async function POST(request) {
  try {
    // Check admin authentication
    const adminSession = getAdminSession(request);
    if (!adminSession || !adminSession.userId) {
      return NextResponse.json(
        { success: false, error: 'Admin authentication required' },
        { status: 401 }
      );
    }

    const { title, content, author, category } = await request.json();

    // Validate required fields
    if (!title || !content || !author) {
      return NextResponse.json(
        { success: false, error: 'Title, content, and author are required' },
        { status: 400 }
      );
    }

    // Create article
    const article = await prisma.articles.create({
      data: {
        title,
        content,
        author,
        category: category || 'general',
      },
    });

    return NextResponse.json({
      success: true,
      data: article,
      message: 'Article created successfully',
    });
  } catch (error) {
    console.error('Error creating article:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create article' },
      { status: 500 }
    );
  }
}
