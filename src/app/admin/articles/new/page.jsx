'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import ArticleForm from '@/components/Articles/ArticleForm';

export default function NewArticlePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (formData) => {
    try {
      setIsLoading(true);
      setError('');

      const response = await fetch('/api/articles', {
        method: 'POST',
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
        throw new Error(data.error || 'Failed to create article');
      }

      const data = await response.json();
      alert('Article created successfully!');
      router.push('/admin/articles');
    } catch (err) {
      setError(err.message || 'Failed to create article');
      console.error('Error creating article:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-8 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="text-blue-600 hover:text-blue-700 font-semibold mb-4"
          >
            ← Back to Articles
          </button>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">
            Create New Article
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Add a new health-related article to the content hub
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-lg">
            {error}
          </div>
        )}

        <ArticleForm onSubmit={handleSubmit} isLoading={isLoading} />
      </div>
    </div>
  );
}
