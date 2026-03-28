'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { AlertCircle, Stethoscope, Mail, Building2, CheckCircle2, AlertTriangle } from 'lucide-react';
import DetailPageHeader from '@/components/Admin/DetailPageHeader';
import InfoCardsGrid from '@/components/Admin/InfoCardsGrid';
import InfoCard from '@/components/Admin/InfoCard';
import ConnectedPatientsList from '@/components/Admin/ConnectedPatientsList';

export default function ProviderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const providerId = params.id;

  const [provider, setProvider] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProviderDetails();
  }, [providerId]);

  const fetchProviderDetails = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/admin/providers/${providerId}`);

      if (response.status === 401) {
        router.push('/admin/login');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch provider details');
      }

      const data = await response.json();
      setProvider(data.provider);
    } catch (err) {
      setError('Failed to load provider details. Please try again.');
      console.error('Error fetching provider:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading provider details...</p>
        </div>
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <DetailPageHeader title="Provider Not Found" subtitle="Go back and try again" icon={Stethoscope} gradient={false} />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-400">Provider not found</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <DetailPageHeader
        title={`${provider.firstName} ${provider.lastName}`}
        subtitle="Healthcare Provider Details"
        icon={Stethoscope}
      />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-28">
        {error && (
          <div className="mb-6 p-4 bg-red-500 bg-opacity-20 border border-red-500 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Provider Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Professional Information Card */}
          <InfoCardsGrid title="Professional Information" icon={Stethoscope} color="blue">
            <InfoCard label="Specialty" value={provider.specialty || 'N/A'} color="blue" />
            <InfoCard label="Email" value={provider.email} icon={Mail} color="blue" />
            <InfoCard
              label="Verification Status"
              value={provider.isVerified ? 'Verified' : 'Pending Approval'}
              icon={provider.isVerified ? CheckCircle2 : AlertTriangle}
              color="blue"
            />
          </InfoCardsGrid>

          {/* Account Information Card */}
          <InfoCardsGrid title="Account Information" icon={Building2} color="purple">
            <InfoCard label="Account Status" value="Active" color="purple" />
            <InfoCard label="Joined Date" value={new Date(provider.createdAt).toLocaleDateString()} color="purple" />
            <InfoCard
              label="Connected Patients"
              value={`${provider.patientCount} patient${provider.patientCount !== 1 ? 's' : ''}`}
              color="purple"
            />
          </InfoCardsGrid>
        </div>

        {/* Connected Patients Section */}
        <ConnectedPatientsList patients={provider.patients} patientCount={provider.patientCount} />
      </main>
    </div>
  );
}
