import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

function getSession() {
  const cookieStore = cookies();
  const sessionCookie = cookieStore.get('livsync_session');

  if (!sessionCookie) return null;

  try {
    return JSON.parse(sessionCookie.value);
  } catch {
    return null;
  }
}

/**
 * POST /api/articles/feedback
 * Submit feedback (helpful/unhelpful) on an article
 */
export async function POST(request) {
  try {
    const session = getSession();
    if (!session || !session.userId) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { articleId, feedback } = await request.json();

    // Validate input
    if (!articleId || !feedback) {
      return NextResponse.json(
        { success: false, message: 'Article ID and feedback are required' },
        { status: 400 }
      );
    }

    if (!['helpful', 'unhelpful'].includes(feedback)) {
      return NextResponse.json(
        { success: false, message: 'Feedback must be "helpful" or "unhelpful"' },
        { status: 400 }
      );
    }

    // Check if article exists
    const article = await prisma.articles.findUnique({
      where: { id: parseInt(articleId) },
    });

    if (!article) {
      return NextResponse.json(
        { success: false, message: 'Article not found' },
        { status: 404 }
      );
    }

    // Check if user already gave feedback on this article
    const existingFeedback = await prisma.article_feedback.findUnique({
      where: {
        article_id_patient_id: {
          article_id: parseInt(articleId),
          patient_id: session.userId,
        },
      },
    });

    let feedbackRecord;
    let isNewFeedback = false;

    if (existingFeedback) {
      // Update existing feedback
      const oldFeedback = existingFeedback.feedback;
      
      feedbackRecord = await prisma.article_feedback.update({
        where: { id: existingFeedback.id },
        data: { feedback },
      });

      // Update article counts
      if (oldFeedback === 'helpful' && feedback === 'unhelpful') {
        await prisma.articles.update({
          where: { id: parseInt(articleId) },
          data: {
            helpful_count: { decrement: 1 },
            unhelpful_count: { increment: 1 },
          },
        });
      } else if (oldFeedback === 'unhelpful' && feedback === 'helpful') {
        await prisma.articles.update({
          where: { id: parseInt(articleId) },
          data: {
            helpful_count: { increment: 1 },
            unhelpful_count: { decrement: 1 },
          },
        });
      }
    } else {
      // Create new feedback
      feedbackRecord = await prisma.article_feedback.create({
        data: {
          article_id: parseInt(articleId),
          patient_id: session.userId,
          feedback,
        },
      });

      isNewFeedback = true;

      // Update article counts
      if (feedback === 'helpful') {
        await prisma.articles.update({
          where: { id: parseInt(articleId) },
          data: { helpful_count: { increment: 1 } },
        });
      } else {
        await prisma.articles.update({
          where: { id: parseInt(articleId) },
          data: { unhelpful_count: { increment: 1 } },
        });
      }
    }

    // Fetch updated article with current counts
    const updatedArticle = await prisma.articles.findUnique({
      where: { id: parseInt(articleId) },
      select: {
        id: true,
        title: true,
        helpful_count: true,
        unhelpful_count: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: isNewFeedback
          ? 'Feedback submitted successfully'
          : 'Feedback updated successfully',
        data: {
          feedback: feedbackRecord,
          article: updatedArticle,
          isNewFeedback,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error submitting article feedback:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to submit feedback' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/articles/feedback?articleId=1
 * Get current user's feedback on an article
 */
export async function GET(request) {
  try {
    const session = getSession();
    if (!session || !session.userId) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const articleId = searchParams.get('articleId');

    if (!articleId) {
      return NextResponse.json(
        { success: false, message: 'Article ID is required' },
        { status: 400 }
      );
    }

    const feedback = await prisma.article_feedback.findUnique({
      where: {
        article_id_patient_id: {
          article_id: parseInt(articleId),
          patient_id: session.userId,
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: feedback || null,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching article feedback:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch feedback' },
      { status: 500 }
    );
  }
}
