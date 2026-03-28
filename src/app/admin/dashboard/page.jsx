'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Stethoscope, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import SecurityLogsWidget from '@/components/Admin/SecurityLogsWidget';

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({
    totalPatients: 0,
    totalProviders: 0,
    approvedProviders: 0,
    pendingProviders: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      
      // Fetch patients and providers in parallel
      const [patientsRes, providersRes] = await Promise.all([
        fetch('/api/admin/patients'),
        fetch('/api/admin/providers'),
      ]);

      if (!patientsRes.ok || !providersRes.ok) {
        if (patientsRes.status === 401 || providersRes.status === 401) {
          router.push('/admin/login');
          return;
        }
        throw new Error('Failed to fetch data');
      }

      const patientsData = await patientsRes.json();
      const providersData = await providersRes.json();

      const patients = patientsData.patients || [];
      const providers = providersData.data?.providers || providersData.providers || [];

      setStats({
        totalPatients: patients.length,
        totalProviders: providers.length,
        approvedProviders: providers.filter(p => p.isVerified).length,
        pendingProviders: providers.filter(p => !p.isVerified).length,
      });
    } catch (err) {
      setError('Failed to load statistics. Please try again.');
      console.error('Error fetching data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/admin/logout', { method: 'POST' });
      router.push('/admin/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 shadow-md border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Admin Dashboard
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  LivSync Platform Management
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-500 bg-opacity-20 border border-red-500 rounded-lg">
            <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Pending Approvals Alert */}
        {stats.pendingProviders > 0 && (
          <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-400 dark:border-yellow-600 rounded-lg">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                  {stats.pendingProviders} Provider{stats.pendingProviders === 1 ? '' : 's'} Pending Approval
                </h3>
                <p className="mt-1 text-xs text-yellow-700 dark:text-yellow-400">
                  Review and approve or reject provider applications on the Healthcare Providers page.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <button
            onClick={() => router.push('/admin/patients')}
            className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-800 hover:shadow-lg hover:border-blue-400 dark:hover:border-blue-500 transition-all duration-300 text-left"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Patients</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{stats.totalPatients}</p>
              </div>
              <div className="flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </button>

          <button
            onClick={() => router.push('/admin/providers')}
            className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-800 hover:shadow-lg hover:border-purple-400 dark:hover:border-purple-500 transition-all duration-300 text-left"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Providers</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{stats.totalProviders}</p>
              </div>
              <div className="flex items-center justify-center w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <Stethoscope className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </button>

          <button
            onClick={() => router.push('/admin/providers')}
            className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-800 hover:shadow-lg hover:border-emerald-400 dark:hover:border-emerald-500 transition-all duration-300 text-left"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Approved Providers</p>
                <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                  {stats.approvedProviders}
                </p>
              </div>
              <div className="flex items-center justify-center w-12 h-12 bg-emerald-100 dark:bg-emerald-900 rounded-lg">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </button>

          <button
            onClick={() => router.push('/admin/providers')}
            className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6 border border-amber-200 dark:border-amber-700 hover:shadow-lg hover:border-amber-400 dark:hover:border-amber-500 transition-all duration-300 text-left"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Pending Approval</p>
                <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">
                  {stats.pendingProviders}
                </p>
              </div>
              <div className="flex items-center justify-center w-12 h-12 bg-amber-100 dark:bg-amber-900 rounded-lg">
                <Clock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </button>
        </div>

        {/* Security Logs Section */}
        <SecurityLogsWidget />
      </main>
    </div>
  );
}
