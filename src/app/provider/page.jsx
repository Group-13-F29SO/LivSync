'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { BarChart3, TrendingUp, FileText } from 'lucide-react';
import CriticalEventsWarningsWidget from '@/components/Provider/CriticalEventsWarningsWidget';
import ConnectedPatientsWidget from '@/components/Provider/ConnectedPatientsWidget';
import PrescriptionsWidget from '@/components/Provider/PrescriptionsWidget';
import NotificationsCenter from '@/components/Provider/NotificationsCenter';

export default function ProviderDashboardPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
    // Redirect patient to their dashboard
    if (!isLoading && user && user.userType !== 'provider') {
      router.push('/dashboard');
    }
  }, [user, isLoading, router]);

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950">
        <p className="text-gray-600 dark:text-gray-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <main className="p-8 overflow-auto bg-blue-50 dark:bg-gray-950 text-gray-900 dark:text-gray-50 pb-32">
        {/* Header Section */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent mb-2">
              Dashboard
            </h1>
            <p className="text-gray-500 dark:text-gray-400">
              Welcome back, {user?.firstName}. Here's an overview of your patients' health status.
            </p>
          </div>
          <NotificationsCenter providerId={user?.id} />
        </div>

        {/* Dashboard Grid */}
        <div className="space-y-6">
          {/* Critical Events & Warnings Row */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 size={20} className="text-orange-500" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-50">
                Health Alerts
              </h2>
            </div>
            <CriticalEventsWarningsWidget providerId={user?.id} />
          </div>

          {/* Connected Patients Row */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={20} className="text-blue-500" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-50">
                Your Patients
              </h2>
            </div>
            <ConnectedPatientsWidget providerId={user?.id} />
          </div>

          {/* Prescriptions Row */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <FileText size={20} className="text-green-500" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-50">
                Prescriptions
              </h2>
            </div>
            <PrescriptionsWidget providerId={user?.id} />
          </div>
        </div>
      </main>
    </div>
  );
}
