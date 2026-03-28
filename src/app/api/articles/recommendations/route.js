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
 * GET /api/articles/recommendations
 * Get article recommendations based on user's health goals
 * 
 * Query params:
 * - recommended: boolean - if true, returns goal-based recommendations
 * - contextual: boolean - if true, returns contextual articles based on recent data
 * - limit: number - max articles to return (default: 5)
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
    const recommended = searchParams.get('recommended') === 'true';
    const contextual = searchParams.get('contextual') === 'true';
    const limit = parseInt(searchParams.get('limit')) || 5;

    let articles = [];

    if (recommended) {
      articles = await getGoalBasedRecommendations(session.userId, limit);
    } else if (contextual) {
      articles = await getContextualRecommendations(session.userId, limit);
    }

    return NextResponse.json(
      {
        success: true,
        data: articles,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching article recommendations:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch recommendations' },
      { status: 500 }
    );
  }
}

/**
 * Get articles based on user's active health goals
 */
async function getGoalBasedRecommendations(patientId, limit) {
  try {
    // Get user's active goals
    const userGoals = await prisma.goals.findMany({
      where: {
        patient_id: patientId,
        is_active: true,
      },
    });

    // Default select fields (works even if new columns don't exist yet)
    const baseSelect = {
      id: true,
      title: true,
      content: true,
      author: true,
      category: true,
      created_at: true,
      updated_at: true,
    };

    // Try to include helpfulness counts if they exist
    let selectFields = { ...baseSelect, helpful_count: true, unhelpful_count: true };
    let orderByFields = [{ helpful_count: 'desc' }, { created_at: 'desc' }];

    if (userGoals.length === 0) {
      // If no goals, return recent articles
      try {
        return await prisma.articles.findMany({
          take: limit,
          orderBy: orderByFields,
          select: selectFields,
        });
      } catch {
        // Fallback if columns don't exist
        return await prisma.articles.findMany({
          take: limit,
          orderBy: { created_at: 'desc' },
          select: baseSelect,
        });
      }
    }

    // Map metric types to article categories
    const metricToCategory = {
      steps: 'fitness',
      heart_rate: 'fitness',
      blood_glucose: 'nutrition',
      hydration: 'hydration',
      sleep: 'sleep',
      calories: 'nutrition',
    };

    // Get relevant categories from user's goals
    const relevantCategories = userGoals
      .map(goal => metricToCategory[goal.metric_type])
      .filter(Boolean);

    if (relevantCategories.length === 0) {
      // No mappable categories, return recent articles
      try {
        return await prisma.articles.findMany({
          take: limit,
          orderBy: orderByFields,
          select: selectFields,
        });
      } catch {
        return await prisma.articles.findMany({
          take: limit,
          orderBy: { created_at: 'desc' },
          select: baseSelect,
        });
      }
    }

    // Get articles matching user's goal categories
    try {
      return await prisma.articles.findMany({
        where: {
          category: {
            in: relevantCategories,
          },
        },
        take: limit,
        orderBy: orderByFields,
        select: selectFields,
      });
    } catch {
      // Fallback if columns don't exist
      return await prisma.articles.findMany({
        where: {
          category: {
            in: relevantCategories,
          },
        },
        take: limit,
        orderBy: { created_at: 'desc' },
        select: baseSelect,
      });
    }
  } catch (error) {
    console.error('Error in getGoalBasedRecommendations:', error);
    return [];
  }
}

/**
 * Get contextual articles based on recent biometric data patterns
 * (e.g., if user had poor sleep, recommend sleep articles)
 */
async function getContextualRecommendations(patientId, limit) {
  try {
    // Get today's biometric data
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

    // Get last 7 days of data
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [sleepData, stepData, heartRateData, glucoseData] = await Promise.all([
      prisma.biometric_data.findMany({
        where: {
          patient_id: patientId,
          metric_type: 'sleep',
          timestamp: { gte: weekStart },
        },
        orderBy: { timestamp: 'desc' },
        take: 7,
      }),
      prisma.biometric_data.findMany({
        where: {
          patient_id: patientId,
          metric_type: 'steps',
          timestamp: { gte: todayStart, lt: todayEnd },
        },
      }),
      prisma.biometric_data.findMany({
        where: {
          patient_id: patientId,
          metric_type: 'heart_rate',
          timestamp: { gte: todayStart, lt: todayEnd },
        },
      }),
      prisma.biometric_data.findMany({
        where: {
          patient_id: patientId,
          metric_type: 'blood_glucose',
          timestamp: { gte: todayStart, lt: todayEnd },
        },
      }),
    ]).catch(() => [[], [], [], []]);

    // Get user's goals for comparison
    const userGoals = await prisma.goals.findMany({
      where: { patient_id: patientId, is_active: true },
    }).catch(() => []);

    const recommendedCategories = [];

    // Check sleep data
    if (sleepData && sleepData.length > 0) {
      try {
        const avgSleep = sleepData.reduce((sum, d) => sum + parseFloat(d.value || 0), 0) / sleepData.length;
        if (avgSleep < 7) {
          recommendedCategories.push('sleep');
        }
      } catch {
        // Skip sleep check if error
      }
    }

    // Check step data
    if (stepData && stepData.length > 0) {
      try {
        const goalSteps = userGoals.find(g => g.metric_type === 'steps')?.target_value || 10000;
        const totalSteps = stepData.reduce((sum, d) => sum + parseFloat(d.value || 0), 0);
        if (totalSteps < goalSteps * 0.5) {
          recommendedCategories.push('fitness');
        }
      } catch {
        // Skip step check if error
      }
    }

    // Check heart rate
    if (heartRateData && heartRateData.length > 0) {
      try {
        const avgHR = heartRateData.reduce((sum, d) => sum + parseFloat(d.value || 0), 0) / heartRateData.length;
        if (avgHR > 100 || avgHR < 50) {
          recommendedCategories.push('fitness');
        }
      } catch {
        // Skip heart rate check if error
      }
    }

    // Check blood glucose
    if (glucoseData && glucoseData.length > 0) {
      try {
        const avgGlucose = glucoseData.reduce((sum, d) => sum + parseFloat(d.value || 0), 0) / glucoseData.length;
        if (avgGlucose > 140) {
          recommendedCategories.push('nutrition');
        }
      } catch {
        // Skip glucose check if error
      }
    }

    // Default select fields
    const baseSelect = {
      id: true,
      title: true,
      content: true,
      author: true,
      category: true,
      created_at: true,
      updated_at: true,
    };

    const selectFieldsWithCounts = { ...baseSelect, helpful_count: true, unhelpful_count: true };
    const orderByFields = [{ helpful_count: 'desc' }, { created_at: 'desc' }];

    // If no issues detected, return articles
    if (recommendedCategories.length === 0) {
      try {
        return await prisma.articles.findMany({
          take: limit,
          orderBy: orderByFields,
          select: selectFieldsWithCounts,
        });
      } catch {
        return await prisma.articles.findMany({
          take: limit,
          orderBy: { created_at: 'desc' },
          select: baseSelect,
        });
      }
    }

    // Get contextual articles
    try {
      return await prisma.articles.findMany({
        where: {
          category: {
            in: recommendedCategories,
          },
        },
        take: limit,
        orderBy: orderByFields,
        select: selectFieldsWithCounts,
      });
    } catch {
      // Fallback if columns don't exist
      return await prisma.articles.findMany({
        where: {
          category: {
            in: recommendedCategories,
          },
        },
        take: limit,
        orderBy: { created_at: 'desc' },
        select: baseSelect,
      });
    }
  } catch (error) {
    console.error('Error in getContextualRecommendations:', error);
    return [];
  }
}
