'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Stethoscope, Clock } from 'lucide-react';
import SecurityLogsWidget from '@/components/Admin/SecurityLogsWidget';
import StatCard from '@/components/Admin/StatCard';
import PendingApprovalsAlert from '@/components/Admin/PendingApprovalsAlert';

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
        totalProviders: providers.filter(p => p.isVerified).length,
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-28">
        {error && (
          <div className="mb-6 p-4 bg-red-500 bg-opacity-20 border border-red-500 rounded-lg">
            <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Pending Approvals Alert */}
        <PendingApprovalsAlert count={stats.pendingProviders} />

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-6 mb-8">
          <StatCard
            title="Total Patients"
            value={stats.totalPatients}
            icon={Users}
            onClick="/admin/patients"
            color="blue"
            loading={isLoading}
          />
          <StatCard
            title="Total Providers"
            value={stats.totalProviders}
            icon={Stethoscope}
            onClick="/admin/providers"
            color="purple"
            loading={isLoading}
          />
          <StatCard
            title="Pending Approval"
            value={stats.pendingProviders}
            icon={Clock}
            onClick="/admin/providers/pending"
            color="amber"
            loading={isLoading}
          />
        </div>

        {/* Security Logs Section */}
        <SecurityLogsWidget />
      </main>
    </div>
  );
}
