'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import ArticleDisplay from '@/components/Articles/ArticleDisplay';
import ArticleCard from '@/components/Articles/ArticleCard';
import { useAuth } from '@/hooks/useAuth';

export default function ArticleDetailPage() {
  const router = useRouter();
  const params = useParams();
  const articleId = params.id;
  const { user, isLoading: authLoading } = useAuth();

  const [article, setArticle] = useState(null);
  const [relatedArticles, setRelatedArticles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchArticle();
    }
  }, [articleId, user]);

  const fetchArticle = async () => {
    try {
      setIsLoading(true);
      setError('');

      const response = await fetch(`/api/articles/${articleId}`);

      if (!response.ok) {
        throw new Error('Article not found');
      }

      const data = await response.json();
      setArticle(data.data);

      // Fetch related articles
      if (data.data.category) {
        fetchRelatedArticles(data.data.category, articleId);
      }
    } catch (err) {
      setError(err.message || 'Failed to load article');
      console.error('Error fetching article:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRelatedArticles = async (category, currentId) => {
    try {
      const response = await fetch(`/api/articles?category=${category}&limit=6`);

      if (response.ok) {
        const data = await response.json();
        const filtered = (data.data?.articles || []).filter(a => a.id !== currentId).slice(0, 3);
        setRelatedArticles(filtered);
      }
    } catch (err) {
      console.error('Error fetching related articles:', err);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950">
        <p className="text-gray-600 dark:text-gray-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-white dark:bg-gray-950">
      <main className="flex-1 p-8 overflow-auto bg-blue-50 dark:bg-gray-950">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <Link
            href="/articles"
            className="text-blue-600 hover:text-blue-700 font-semibold mb-6 inline-block"
          >
            ← Back to All Articles
          </Link>

          {/* Loading State */}
          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-400">Loading article...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
              <Link
                href="/articles"
                className="text-blue-600 hover:text-blue-700 font-semibold"
              >
                Back to Articles
              </Link>
            </div>
          ) : article ? (
            <>
              {/* Article */}
              <ArticleDisplay article={article} />

              {/* Related Articles */}
              {relatedArticles.length > 0 && (
                <div className="mt-16 pt-12 border-t border-gray-200 dark:border-gray-800">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
                    Related Articles
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {relatedArticles.map(relatedArticle => (
                      <ArticleCard key={relatedArticle.id} article={relatedArticle} />
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-400">Article not found</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
