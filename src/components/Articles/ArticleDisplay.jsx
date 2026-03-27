'use client';

import ArticleFeedback from './ArticleFeedback';

export default function ArticleDisplay({ article }) {
  if (!article) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">Article not found</p>
      </div>
    );
  }

  const createdDate = new Date(article.created_at);
  const formattedDate = createdDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <article className="bg-white dark:bg-gray-900 p-8 rounded-lg shadow-lg">
      <div className="mb-6">
        <span className="inline-block px-3 py-1 text-sm font-semibold rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 mb-4">
          {article.category || 'General'}
        </span>
        
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          {article.title}
        </h1>

        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 pb-4">
          <span>By <span className="font-semibold text-gray-900 dark:text-gray-100">{article.author}</span></span>
          <span>•</span>
          <time>{formattedDate}</time>
        </div>
      </div>

      <div className="prose dark:prose-invert max-w-none">
        <div 
          className="text-gray-700 dark:text-gray-300 leading-relaxed text-lg"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />
      </div>

      {/* Article Feedback Component */}
      <ArticleFeedback
        articleId={article.id}
        helpfulCount={article.helpful_count || 0}
        unhelpfulCount={article.unhelpful_count || 0}
      />
    </article>
  );
}
