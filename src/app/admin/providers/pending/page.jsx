'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Search, Clock } from 'lucide-react';
import UserCard from '@/components/Admin/UserCard';

export default function PendingProvidersPage() {
  const router = useRouter();
  const [providers, setProviders] = useState([]);
  const [filteredProviders, setFilteredProviders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchProviders();
  }, []);

  useEffect(() => {
    // Filter providers based on search query
    const query = searchQuery.toLowerCase();
    const filtered = providers.filter(provider =>
      provider.firstName.toLowerCase().includes(query) ||
      provider.lastName.toLowerCase().includes(query) ||
      provider.email.toLowerCase().includes(query) ||
      (provider.username && provider.username.toLowerCase().includes(query))
    );
    setFilteredProviders(filtered);
  }, [searchQuery, providers]);

  const fetchProviders = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/providers');

      if (response.status === 401) {
        router.push('/admin/login');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch providers');
      }

      const data = await response.json();
      const allProviders = data.data?.providers || data.providers || [];
      // Filter to show only pending providers
      const pendingProviders = allProviders.filter(p => !p.isVerified);
      setProviders(pendingProviders);
    } catch (err) {
      setError('Failed to load providers. Please try again.');
      console.error('Error fetching providers:', err);
    } finally {
      setIsLoading(false);
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
        setProviders(prev => prev.filter(p => p.id !== providerId));
        setFilteredProviders(prev => prev.filter(p => p.id !== providerId));
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
        setProviders(prev => prev.filter(p => p.id !== providerId));
        setFilteredProviders(prev => prev.filter(p => p.id !== providerId));
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
        setFilteredProviders(prev => prev.filter(p => p.id !== providerId));
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to delete provider');
      }
    } catch (err) {
      console.error('Error deleting provider:', err);
      setError('Failed to delete provider');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading pending approvals...</p>
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
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/admin/dashboard')}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                aria-label="Go back"
              >
                <ChevronLeft className="w-6 h-6 text-gray-600 dark:text-gray-400" />
              </button>
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-amber-500/20 to-orange-600/20 rounded-lg">
                <Clock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                  Pending Approvals
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {filteredProviders.length} total provider{filteredProviders.length === 1 ? '' : 's'}
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

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400 dark:text-gray-600" />
            <input
              type="text"
              placeholder="Search by name, email, or username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent"
            />
          </div>
        </div>

        {/* Providers Grid */}
        {filteredProviders.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-12 text-center border border-gray-200 dark:border-gray-800">
            <Clock className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
            <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
              {providers.length === 0 ? 'No pending approvals' : 'No matching providers'}
            </h3>
            <p className="text-gray-500 dark:text-gray-500 text-sm">
              {providers.length === 0
                ? 'All provider applications have been reviewed.'
                : 'Try adjusting your search criteria.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredProviders.map((provider) => (
              <UserCard
                key={provider.id}
                user={provider}
                type="providers"
                onDelete={handleDeleteProvider}
                onApprove={handleApproveProvider}
                onReject={handleRejectProvider}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
