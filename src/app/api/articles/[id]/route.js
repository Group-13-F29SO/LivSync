/**
 * Articles Detail API Routes
 * GET: Fetch a single article
 * PUT: Update an article (admin only)
 * DELETE: Delete an article (admin only)
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
 * GET /api/articles/[id]
 * Fetch a single article by ID
 */
export async function GET(request, { params }) {
  try {
    const { id } = params;
    const articleId = parseInt(id);

    if (isNaN(articleId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid article ID' },
        { status: 400 }
      );
    }

    const article = await prisma.articles.findUnique({
      where: { id: articleId },
    });

    if (!article) {
      return NextResponse.json(
        { success: false, error: 'Article not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: article,
    });
  } catch (error) {
    console.error('Error fetching article:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch article' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/articles/[id]
 * Update an article (admin only)
 */
export async function PUT(request, { params }) {
  try {
    // Check admin authentication
    const adminSession = getAdminSession(request);
    if (!adminSession || !adminSession.userId) {
      return NextResponse.json(
        { success: false, error: 'Admin authentication required' },
        { status: 401 }
      );
    }

    const { id } = params;
    const articleId = parseInt(id);

    if (isNaN(articleId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid article ID' },
        { status: 400 }
      );
    }

    // Check if article exists
    const existingArticle = await prisma.articles.findUnique({
      where: { id: articleId },
    });

    if (!existingArticle) {
      return NextResponse.json(
        { success: false, error: 'Article not found' },
        { status: 404 }
      );
    }

    const { title, content, author, category } = await request.json();

    // Update article
    const updatedArticle = await prisma.articles.update({
      where: { id: articleId },
      data: {
        ...(title && { title }),
        ...(content && { content }),
        ...(author && { author }),
        ...(category && { category }),
        updated_at: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedArticle,
      message: 'Article updated successfully',
    });
  } catch (error) {
    console.error('Error updating article:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update article' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/articles/[id]
 * Delete an article (admin only)
 */
export async function DELETE(request, { params }) {
  try {
    // Check admin authentication
    const adminSession = getAdminSession(request);
    if (!adminSession || !adminSession.userId) {
      return NextResponse.json(
        { success: false, error: 'Admin authentication required' },
        { status: 401 }
      );
    }

    const { id } = params;
    const articleId = parseInt(id);

    if (isNaN(articleId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid article ID' },
        { status: 400 }
      );
    }

    // Check if article exists
    const existingArticle = await prisma.articles.findUnique({
      where: { id: articleId },
    });

    if (!existingArticle) {
      return NextResponse.json(
        { success: false, error: 'Article not found' },
        { status: 404 }
      );
    }

    // Delete article
    await prisma.articles.delete({
      where: { id: articleId },
    });

    return NextResponse.json({
      success: true,
      message: 'Article deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting article:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete article' },
      { status: 500 }
    );
  }
}
