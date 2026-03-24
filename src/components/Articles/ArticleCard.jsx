'use client';

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

export default function ArticleCard({ article, onClick }) {
  if (!article) {
    return null;
  }

  const timeAgo = formatTimeAgo(article.created_at);

  return (
    <Link href={`/articles/${article.id}`}>
      <div 
        onClick={onClick}
        className="h-full flex flex-col bg-white dark:bg-gray-900 p-6 rounded-lg shadow dark:shadow-lg transform transition-all duration-500 hover:-translate-y-1 hover:scale-105 hover:shadow-xl dark:hover:shadow-xl hover:z-10 cursor-pointer"
      >
        <div className="flex items-start justify-between mb-3">
          <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
            {article.category || 'General'}
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap ml-2">
            {timeAgo}
          </span>
        </div>

        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2 line-clamp-2">
          {article.title}
        </h2>

        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
          {article.content.replace(/<[^>]*>/g, '')}
        </p>

        <div className="mt-auto pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            By <span className="font-semibold">{article.author}</span>
          </p>
        </div>
      </div>
    </Link>
  );
}
