'use client';

import { useState } from 'react';

const ARTICLE_CATEGORIES = [
  'nutrition',
  'fitness',
  'sleep',
  'mental-health',
  'hydration',
  'general',
];

export default function ArticleForm({ articleData, onSubmit, isLoading }) {
  const [formData, setFormData] = useState({
    title: articleData?.title || '',
    content: articleData?.content || '',
    author: articleData?.author || '',
    category: articleData?.category || 'general',
  });

  const [charCount, setCharCount] = useState(formData.content.length);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    if (name === 'content') {
      setCharCount(value.length);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.title.trim()) {
      alert('Title is required');
      return;
    }
    if (!formData.content.trim()) {
      alert('Content is required');
      return;
    }
    if (!formData.author.trim()) {
      alert('Author is required');
      return;
    }

    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 p-8 rounded-lg shadow-lg max-w-4xl mx-auto">
      <div className="space-y-6">
        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Article Title *
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Enter article title"
            maxLength={255}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all"
            disabled={isLoading}
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {formData.title.length}/255 characters
          </p>
        </div>

        {/* Author */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="author" className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Author *
            </label>
            <input
              type="text"
              id="author"
              name="author"
              value={formData.author}
              onChange={handleChange}
              placeholder="Enter author name"
              maxLength={100}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all"
              disabled={isLoading}
            />
          </div>

          {/* Category */}
          <div>
            <label htmlFor="category" className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Category
            </label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all"
              disabled={isLoading}
            >
              {ARTICLE_CATEGORIES.map(cat => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1).replace('-', ' ')}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Content */}
        <div>
          <label htmlFor="content" className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Content *
          </label>
          <textarea
            id="content"
            name="content"
            value={formData.content}
            onChange={handleChange}
            placeholder="Enter article content (supports HTML formatting)"
            rows={12}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all font-monospace text-sm"
            disabled={isLoading}
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {charCount} characters • Supports HTML tags like &lt;b&gt;, &lt;i&gt;, &lt;p&gt;, &lt;br/&gt;, &lt;ul&gt;, etc.
          </p>
        </div>

        {/* Submit Button */}
        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={isLoading}
            className={`flex-1 px-6 py-3 font-semibold rounded-lg text-white transition-all ${
              isLoading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 active:scale-95'
            }`}
          >
            {isLoading ? 'Saving...' : articleData ? 'Update Article' : 'Create Article'}
          </button>
        </div>
      </div>
    </form>
  );
}
