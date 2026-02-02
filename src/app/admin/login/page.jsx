'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  // Force light mode for admin login page
  useEffect(() => {
    document.documentElement.classList.remove('dark');
  }, []);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Login failed');
        setIsLoading(false);
        return;
      }

      // Redirect to admin dashboard on success
      router.push('/admin/dashboard');
    } catch (err) {
      setError('An error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  const handleTestLogin = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/admin/test-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Test login failed');
        setIsLoading(false);
        return;
      }

      // Redirect to admin dashboard on success
      router.push('/admin/dashboard');
    } catch (err) {
      setError('An error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-purple-500 to-pink-600 dark:from-blue-950 dark:via-purple-950 dark:to-pink-950 px-4">
      <div className="bg-white dark:bg-gray-900 bg-opacity-30 dark:bg-opacity-40 backdrop-blur-sm rounded-2xl p-8 w-full max-w-md shadow-xl">
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 via-purple-500 to-pink-600 bg-clip-text text-transparent text-center" style={{paddingBottom: '8px'}}>
          Admin Portal
        </h1>
        <p className="text-center text-gray-100 dark:text-gray-300 mb-8 text-sm">
          Secure access for administrators
        </p>

        {error && (
          <div className="mb-6 p-4 bg-red-500 bg-opacity-20 border border-red-500 rounded-lg">
            <p className="text-red-200 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-gray-100 dark:text-gray-200 text-sm font-medium mb-2">
              Admin Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="admin@livsync.com"
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-purple-500 dark:focus:border-purple-400 transition-colors"
              required
            />
          </div>

          <div>
            <label className="block text-gray-100 dark:text-gray-200 text-sm font-medium mb-2">
              Password
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => handleChange('password', e.target.value)}
              placeholder="Enter your password"
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-purple-500 dark:focus:border-purple-400 transition-colors"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-br from-blue-600 via-purple-500 to-pink-600 text-white font-semibold py-2 rounded-lg hover:shadow-lg transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Signing In...' : 'Sign In as Admin'}
          </button>

          

          <button
            type="button"
            onClick={handleTestLogin}
            disabled={isLoading}
            className="w-full bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-semibold py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Quick Test Login
          </button>

          <div className="text-center text-sm">
            <span className="text-gray-100 dark:text-gray-300">Not an admin? </span>
            <a href="/login" className="text-blue-400 dark:text-blue-300 hover:underline font-medium">
              Regular login
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
