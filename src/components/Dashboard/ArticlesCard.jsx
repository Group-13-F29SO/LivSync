'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';

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
  const [articles, setArticles] = useState([null, null, null]); // [random, goal-based, contextual]
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      setIsLoading(true);
      setError('');

      const [randomRes, goalRes, contextualRes] = await Promise.all([
        fetch('/api/articles/random', { credentials: 'include' }),
        fetch('/api/articles/recommendations?recommended=true&limit=1', { credentials: 'include' }),
        fetch('/api/articles/recommendations?contextual=true&limit=1', { credentials: 'include' }),
      ]);

      const [randomData, goalData, contextualData] = await Promise.all([
        randomRes.json(),
        goalRes.json(),
        contextualRes.json(),
      ]);

      setArticles([
        randomData.data || null,
        (goalData.data && goalData.data.length > 0) ? goalData.data[0] : null,
        (contextualData.data && contextualData.data.length > 0) ? contextualData.data[0] : null,
      ]);
    } catch (err) {
      setError('Failed to load articles');
      console.error('Error fetching articles:', err);
      setArticles([null, null, null]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchArticles();
    setIsRefreshing(false);
  };

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + 3) % 3);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % 3);
  };

  const currentArticle = articles[currentIndex];
  const timeAgo = currentArticle ? formatTimeAgo(currentArticle.created_at) : '';

  const getArticleLabel = (index) => {
    const labels = ['Random', 'For Your Goals', 'Based on Your Data'];
    return labels[index];
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900 p-6 rounded-lg shadow dark:shadow-lg transform transition-all duration-500 hover:-translate-y-1 hover:scale-105 hover:shadow-xl dark:hover:shadow-xl hover:z-10">
      <div className="flex items-center justify-between gap-2 mb-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
          Health Articles
        </h3>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className={`p-1.5 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50 ${
            isRefreshing ? 'animate-spin' : ''
          }`}
          title="Refresh articles"
        >
          <RotateCcw className="w-5 h-5 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400" />
        </button>
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-500 dark:text-gray-400 text-sm">Loading articles...</p>
        </div>
      ) : (
        <>
          {currentArticle ? (
            <>
              <div className="mb-3 flex items-center gap-2">
                <span className="inline-block px-2 py-1 text-xs font-semibold rounded bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                  {currentArticle.category || 'General'}
                </span>
                <span className="inline-block px-2 py-1 text-xs font-semibold rounded bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200">
                  {getArticleLabel(currentIndex)}
                </span>
              </div>

              <h4 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-2 line-clamp-2">
                {currentArticle.title}
              </h4>

              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                {currentArticle.content.replace(/<[^>]*>/g, '')}
              </p>

              {/* Helpful feedback display */}
              {(currentArticle.helpful_count || currentArticle.unhelpful_count) ? (
                <div className="mb-3 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  <span>👍 {currentArticle.helpful_count || 0}</span>
                  <span>👎 {currentArticle.unhelpful_count || 0}</span>
                </div>
              ) : null}

              <div className="mt-auto pt-3 border-t border-gray-200 dark:border-gray-700 mb-4">
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-3">
                  <span>By {currentArticle.author}</span>
                  <span>{timeAgo}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Link
                  href={`/articles/${currentArticle.id}`}
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
              <p className="text-gray-500 dark:text-gray-400 text-sm text-center mb-4">
                {error ? `Error: ${error}` : 'No article available'}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">Use arrows to browse other articles</p>
            </div>
          )}

          {/* Navigation always visible */}
          <div className="flex gap-2 items-center my-4">
            <button
              onClick={handlePrevious}
              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition-colors"
              title="Previous article"
            >
              <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>

            <div className="flex-1 flex gap-1 justify-center">
              {[0, 1, 2].map((idx) => (
                <div
                  key={idx}
                  className={`h-1 flex-1 rounded-full transition-colors ${
                    idx === currentIndex
                      ? 'bg-blue-600 dark:bg-blue-400'
                      : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                />
              ))}
            </div>

            <button
              onClick={handleNext}
              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition-colors"
              title="Next article"
            >
              <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
