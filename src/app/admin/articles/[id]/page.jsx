'use client';

import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import ArticleForm from '@/components/Articles/ArticleForm';

export default function EditArticlePage() {
  const router = useRouter();
  const params = useParams();
  const articleId = params.id;

  const [article, setArticle] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchArticle();
  }, [articleId]);

  const fetchArticle = async () => {
    try {
      setIsLoading(true);
      setError('');

      const response = await fetch(`/api/articles/${articleId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch article');
      }

      const data = await response.json();
      setArticle(data.data);
    } catch (err) {
      setError(err.message || 'Failed to load article');
      console.error('Error fetching article:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (formData) => {
    try {
      setIsSaving(true);
      setError('');

      const response = await fetch(`/api/articles/${articleId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.status === 401) {
        router.push('/admin/login');
        return;
      }

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update article');
      }

      alert('Article updated successfully!');
      router.push('/admin/articles');
    } catch (err) {
      setError(err.message || 'Failed to update article');
      console.error('Error updating article:', err);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mb-2"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading article...</p>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">Article not found</p>
          <button
            onClick={() => router.push('/admin/articles')}
            className="text-blue-600 hover:text-blue-700 font-semibold"
          >
            Back to Articles
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="bg-white dark:bg-gray-900 shadow-md border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div>
            <button
              onClick={() => router.back()}
              className="text-blue-600 hover:text-blue-700 font-semibold mb-3"
            >
              ← Back to Articles
            </button>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {article?.title}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Edit article details
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-28">
        {error && (
          <div className="mb-6 p-4 bg-red-500 bg-opacity-20 border border-red-500 rounded-lg">
            <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
          </div>
        )}

        <ArticleForm article={article} onSubmit={handleSubmit} isLoading={isSaving} />
      </main>
    </div>
  );
}
