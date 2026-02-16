'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminSection from '@/components/Admin/AdminSection';

export default function AdminDashboard() {
  const router = useRouter();
  const [patients, setPatients] = useState([]);
  const [providers, setProviders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
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

      setPatients(patientsData.patients);
      setProviders(providersData.data?.providers || providersData.providers || []);
    } catch (err) {
      setError('Failed to load data. Please try again.');
      console.error('Error fetching data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePatient = async (patientId) => {
    try {
      const response = await fetch('/api/admin/patients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'delete',
          patientId,
        }),
      });

      if (response.ok) {
        setPatients(prev => prev.filter(p => p.id !== patientId));
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to delete patient');
      }
    } catch (err) {
      console.error('Error deleting patient:', err);
      setError('Failed to delete patient');
    }
  };

  const handleApproveProvider = async (providerId) => {
    try {
      const response = await fetch('/api/admin/providers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'approve',
          providerId,
        }),
      });

      if (response.ok) {
        // Update the provider's status in the local state
        setProviders(prev => prev.map(p => 
          p.id === providerId ? { ...p, isVerified: true, approvalStatus: 'approved' } : p
        ));
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to approve provider');
      }
    } catch (err) {
      console.error('Error approving provider:', err);
      setError('Failed to approve provider');
    }
  };

  const handleRejectProvider = async (providerId) => {
    try {
      const response = await fetch('/api/admin/providers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'reject',
          providerId,
        }),
      });

      if (response.ok) {
        // Remove the rejected provider from the list
        setProviders(prev => prev.filter(p => p.id !== providerId));
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to reject provider');
      }
    } catch (err) {
      console.error('Error rejecting provider:', err);
      setError('Failed to reject provider');
    }
  };

  const handleDeleteProvider = async (providerId) => {
    try {
      const response = await fetch('/api/admin/providers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'delete',
          providerId,
        }),
      });

      if (response.ok) {
        setProviders(prev => prev.filter(p => p.id !== providerId));
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to delete provider');
      }
    } catch (err) {
      console.error('Error deleting provider:', err);
      setError('Failed to delete provider');
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
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-red-500 to-purple-600 rounded-lg mr-3">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Admin Dashboard
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  LivSync Platform Management
                </p>
              </div>
            </div>
            
            <button
              onClick={handleLogout}
              className="flex items-center px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
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
        {providers.filter(p => !p.isVerified).length > 0 && (
          <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-400 dark:border-yellow-600 rounded-lg">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                  {providers.filter(p => !p.isVerified).length} Provider{providers.filter(p => !p.isVerified).length === 1 ? '' : 's'} Pending Approval
                </h3>
                <p className="mt-1 text-xs text-yellow-700 dark:text-yellow-400">
                  Review and approve or reject provider applications below in the Healthcare Providers section.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Patients</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{patients.length}</p>
              </div>
              <div className="flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Providers</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{providers.length}</p>
              </div>
              <div className="flex items-center justify-center w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Approved Providers</p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {providers.filter(p => p.isVerified).length}
                </p>
              </div>
              <div className="flex items-center justify-center w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg">
                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-6 border border-yellow-300 dark:border-yellow-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Pending Approval</p>
                <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                  {providers.filter(p => !p.isVerified).length}
                </p>
              </div>
              <div className="flex items-center justify-center w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Patients Section */}
        <AdminSection
          title="Patients"
          users={patients}
          type="patients"
          onDelete={handleDeletePatient}
          icon={
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          }
        />

        {/* Healthcare Providers Section */}
        <AdminSection
          title="Healthcare Providers"
          users={providers}
          type="providers"
          onDelete={handleDeleteProvider}
          onApprove={handleApproveProvider}
          onReject={handleRejectProvider}
          icon={
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
        />
      </main>
    </div>
  );
}
