'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

/**
 * Format date to relative time string (e.g., "2 hours ago")
 */
function formatTimeAgo(date) {
  const now = new Date();
  const diffMs = now - new Date(date);
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);

  if (diffSecs < 60) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffWeeks < 4) return `${diffWeeks}w ago`;
  
  const date_obj = new Date(date);
  return date_obj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: date_obj.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
}

export default function DashboardArticlesCard() {
  const [article, setArticle] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [recommendationType, setRecommendationType] = useState('contextual'); // 'contextual' or 'goal-based' or 'random'
  const [badge, setBadge] = useState('');

  useEffect(() => {
    fetchArticle();
  }, [recommendationType]);

  const fetchArticle = async () => {
    try {
      setIsLoading(true);
      setError('');
      setBadge('');

      let url = '/api/articles/random';
      let badgeText = 'Random';
      let shouldTryRandom = false;

      if (recommendationType === 'contextual') {
        url = '/api/articles/recommendations?contextual=true&limit=1';
        badgeText = '📊 Contextual';
        shouldTryRandom = true;
      } else if (recommendationType === 'goal-based') {
        url = '/api/articles/recommendations?recommended=true&limit=1';
        badgeText = '🎯 For Your Goals';
        shouldTryRandom = true;
      }

      const response = await fetch(url, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch article (${response.status})`);
      }

      const data = await response.json();
      
      if (data.success === false) {
        throw new Error(data.message || 'Failed to fetch article');
      }

      // Handle both array and single object responses
      let article = null;
      if (Array.isArray(data.data) && data.data.length > 0) {
        article = data.data[0];
      } else if (!Array.isArray(data.data) && data.data) {
        article = data.data;
      }

      if (article) {
        setArticle(article);
        setBadge(badgeText);
      } else if (shouldTryRandom) {
        // Try random article as fallback
        const randomResponse = await fetch('/api/articles/random', {
          credentials: 'include',
        });

        if (randomResponse.ok) {
          const randomData = await randomResponse.json();
          if (randomData.data) {
            setArticle(randomData.data);
            setBadge('🔀 Random');
            return;
          }
        }

        setArticle(null);
        setError('No articles available');
      } else {
        setArticle(null);
        setError('No articles available');
      }
    } catch (err) {
      setError(err.message);
      console.error('Error fetching article:', err);
      
      // Try fallback to random article on error
      if (recommendationType !== 'random') {
        try {
          const randomResponse = await fetch('/api/articles/random', {
            credentials: 'include',
          });

          if (randomResponse.ok) {
            const randomData = await randomResponse.json();
            if (randomData.data) {
              setArticle(randomData.data);
              setBadge('🔀 Fallback');
              setError('');
              return;
            }
          }
        } catch (fallbackErr) {
          console.error('Fallback random article failed:', fallbackErr);
        }
      }

      setArticle(null);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshArticle = () => {
    fetchArticle();
  };

  const cycleRecommendationType = () => {
    const types = ['contextual', 'goal-based', 'random'];
    const currentIndex = types.indexOf(recommendationType);
    const nextIndex = (currentIndex + 1) % types.length;
    setRecommendationType(types[nextIndex]);
  };

  const timeAgo = article ? formatTimeAgo(article.created_at) : '';

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900 p-6 rounded-lg shadow dark:shadow-lg transform transition-all duration-500 hover:-translate-y-1 hover:scale-105 hover:shadow-xl dark:hover:shadow-xl hover:z-10">
      <div className="flex items-center justify-between gap-2 mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
          Health Articles
        </h3>
        {article && (
          <div className="flex gap-1">
            <button
              onClick={cycleRecommendationType}
              className="text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded hover:bg-purple-200 dark:hover:bg-purple-800 transition-colors"
              title="Cycle through recommendation types"
            >
              {recommendationType === 'contextual' && '📊'}
              {recommendationType === 'goal-based' && '🎯'}
              {recommendationType === 'random' && '🔀'}
            </button>
            <button
              onClick={refreshArticle}
              className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
              title="Get another article"
            >
              🔄
            </button>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-500 dark:text-gray-400 text-sm">Loading article...</p>
        </div>
      ) : article ? (
        <>
          <div className="mb-3 flex items-center gap-2">
            <span className="inline-block px-2 py-1 text-xs font-semibold rounded bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
              {article.category || 'General'}
            </span>
            {badge && (
              <span className="inline-block px-2 py-1 text-xs font-semibold rounded bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200">
                {badge}
              </span>
            )}
          </div>

          <h4 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-2 line-clamp-2">
            {article.title}
          </h4>

          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
            {article.content.replace(/<[^>]*>/g, '')}
          </p>

          {/* Helpful feedback display */}
          {(article.helpful_count || article.unhelpful_count) ? (
            <div className="mb-3 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <span>👍 {article.helpful_count || 0}</span>
              <span>👎 {article.unhelpful_count || 0}</span>
            </div>
          ) : null}

          <div className="mt-auto pt-3 border-t border-gray-200 dark:border-gray-700 mb-4">
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-3">
              <span>By {article.author}</span>
              <span>{timeAgo}</span>
            </div>
          </div>

          <div className="flex gap-2">
            <Link
              href={`/articles/${article.id}`}
              className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded transition-colors text-center"
            >
              Read More
            </Link>
            <Link
              href="/articles"
              className="flex-1 px-3 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 text-sm font-semibold rounded transition-colors text-center"
            >
              View All
            </Link>
          </div>
        </>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center py-6">
          <p className="text-gray-500 dark:text-gray-400 text-sm text-center">
            {error ? `Error: ${error}` : 'No articles available yet'}
          </p>
        </div>
      )}
    </div>
  );
}
