'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';

export default function ProviderDashboardPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [providerData, setProviderData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated and is a provider
    if (user && user.userType === 'provider') {
      setProviderData(user);
      setLoading(false);
    } else if (user && user.userType !== 'provider') {
      // Redirect non-providers
      router.push('/dashboard');
    } else if (!user && !loading) {
      // Redirect unauthenticated users
      router.push('/login');
    }
  }, [user, router, loading]);

  const handleLogout = async () => {
    await logout();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-500 to-pink-600 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!providerData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-500 to-pink-600 dark:from-blue-950 dark:via-purple-950 dark:to-pink-950">
      <div className="max-w-6xl mx-auto px-8 py-12">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-white">Provider Dashboard</h1>
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
          >
            Logout
          </button>
        </div>

        {/* Welcome Card */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 mb-8">
          <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-blue-600 via-purple-500 to-pink-600 bg-clip-text text-transparent">
            Welcome, {providerData.firstName}!
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Provider Info Card */}
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                Provider Information
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Email</p>
                  <p className="text-gray-900 dark:text-gray-100 font-medium">
                    {providerData.email}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Full Name</p>
                  <p className="text-gray-900 dark:text-gray-100 font-medium">
                    {providerData.firstName} {providerData.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Specialty</p>
                  <p className="text-gray-900 dark:text-gray-100 font-medium">
                    {providerData.specialty || 'Not specified'}
                  </p>
                </div>
              </div>
            </div>

            {/* Status Card */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-800 dark:to-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                Account Status
              </h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                  <p className="text-gray-900 dark:text-gray-100 font-medium">
                    Successfully Logged In ✓
                  </p>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                  <p className="text-gray-900 dark:text-gray-100 font-medium">
                    Account Verified ✓
                  </p>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
                  Provider authentication is working correctly!
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Placeholder Features */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8">
          <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
            Upcoming Features
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
              <div className="text-4xl mb-2">📋</div>
              <p className="text-gray-700 dark:text-gray-300 font-medium">
                Patient Management
              </p>
            </div>
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
              <div className="text-4xl mb-2">📊</div>
              <p className="text-gray-700 dark:text-gray-300 font-medium">
                Analytics & Reports
              </p>
            </div>
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
              <div className="text-4xl mb-2">💬</div>
              <p className="text-gray-700 dark:text-gray-300 font-medium">
                Patient Communication
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
