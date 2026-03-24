'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AdminArticlesPage() {
  const router = useRouter();
  const [articles, setArticles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  const CATEGORIES = [
    'nutrition',
    'fitness',
    'sleep',
    'mental-health',
    'hydration',
    'general',
  ];

  useEffect(() => {
    fetchArticles();
  }, [page, searchTerm, selectedCategory]);

  const fetchArticles = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(searchTerm && { search: searchTerm }),
        ...(selectedCategory && { category: selectedCategory }),
      });

      const response = await fetch(`/api/articles?${params}`);

      if (response.status === 401) {
        router.push('/admin/login');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch articles');
      }

      const data = await response.json();
      setArticles(data.data?.articles || []);
      setTotalPages(data.data?.pagination?.totalPages || 1);
    } catch (err) {
      setError(err.message || 'Failed to load articles');
      console.error('Error fetching articles:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteArticle = async (articleId) => {
    if (!confirm('Are you sure you want to delete this article?')) {
      return;
    }

    try {
      const response = await fetch(`/api/articles/${articleId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete article');
      }

      setArticles(prev => prev.filter(a => a.id !== articleId));
      alert('Article deleted successfully');
    } catch (err) {
      setError(err.message || 'Failed to delete article');
      console.error('Error deleting article:', err);
    }
  };

  const handleSearch = (value) => {
    setSearchTerm(value);
    setPage(1);
  };

  const handleCategoryFilter = (category) => {
    setSelectedCategory(category);
    setPage(1);
  };

  return (
    <div className="p-8 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 min-h-screen">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">
                Article Management
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Create, edit, and manage all articles in the system
              </p>
            </div>
            <Link
              href="/admin/articles/new"
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
            >
              + New Article
            </Link>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col gap-4 md:flex-row md:gap-4">
            <input
              type="text"
              placeholder="Search articles by title or content..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="flex-1 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={selectedCategory}
              onChange={(e) => handleCategoryFilter(e.target.value)}
              className="px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Categories</option>
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1).replace('-', ' ')}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-lg">
            {error}
          </div>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">Loading articles...</p>
          </div>
        ) : articles.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-lg">
            <p className="text-gray-600 dark:text-gray-400 mb-4">No articles found</p>
            <Link
              href="/admin/articles/new"
              className="text-blue-600 hover:text-blue-700 font-semibold"
            >
              Create the first article
            </Link>
          </div>
        ) : (
          <>
            {/* Articles Table */}
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">
                      Title
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">
                      Author
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">
                      Category
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">
                      Created
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-gray-100">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {articles.map(article => (
                    <tr key={article.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100 line-clamp-1">
                            {article.title}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
                            {article.content.replace(/<[^>]*>/g, '').substring(0, 50)}...
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                        {article.author}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                          {article.category || 'General'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                        {new Date(article.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <Link
                            href={`/admin/articles/${article.id}`}
                            className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => handleDeleteArticle(article.id)}
                            className="px-3 py-1 text-sm bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 flex justify-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <div className="flex items-center gap-2">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`px-3 py-2 rounded-lg transition-colors ${
                        page === p
                          ? 'bg-blue-600 text-white'
                          : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
