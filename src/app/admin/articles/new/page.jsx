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
              Create New Article
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Add a new health-related article to the content hub
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

        <ArticleForm onSubmit={handleSubmit} isLoading={isLoading} />
      </main>
    </div>
  );
}
