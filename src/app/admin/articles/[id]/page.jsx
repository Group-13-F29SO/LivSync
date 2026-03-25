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
      <div className="p-8 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 min-h-screen flex items-center justify-center">
        <p className="text-gray-600 dark:text-gray-400">Loading article...</p>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="p-8 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 min-h-screen flex items-center justify-center">
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
    <div className="p-8 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <button
            onClick={() => router.push('/admin/articles')}
            className="text-blue-600 hover:text-blue-700 font-semibold mb-4"
          >
            ← Back to Articles
          </button>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">
            Edit Article
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Update the article details
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-lg">
            {error}
          </div>
        )}

        <ArticleForm
          articleData={article}
          onSubmit={handleSubmit}
          isLoading={isSaving}
        />
      </div>
    </div>
  );
}
