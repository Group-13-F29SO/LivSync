/**
 * Random Article API Route
 * GET: Fetch a random article
 */

import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

/**
 * GET /api/articles/random
 * Fetch a random article
 */
export async function GET(request) {
  try {
    // Get total count of articles
    const count = await prisma.articles.count();

    if (count === 0) {
      return NextResponse.json({
        success: true,
        data: null,
        message: 'No articles available',
      });
    }

    // Generate random skip value
    const randomSkip = Math.floor(Math.random() * count);

    // Fetch single random article
    const article = await prisma.articles.findFirst({
      skip: randomSkip,
      take: 1,
    });

    return NextResponse.json({
      success: true,
      data: article,
    });
  } catch (error) {
    console.error('Error fetching random article:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch random article' },
      { status: 500 }
    );
  }
}
