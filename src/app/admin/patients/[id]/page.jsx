'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { AlertCircle, Mail, User, Cake, Users } from 'lucide-react';
import DetailPageHeader from '@/components/Admin/DetailPageHeader';
import InfoCardsGrid from '@/components/Admin/InfoCardsGrid';
import InfoCard from '@/components/Admin/InfoCard';
import BiometricsTestingTool from '@/components/Admin/BiometricsTestingTool';

export default function PatientDetailPage() {
  const router = useRouter();
  const params = useParams();
  const patientId = params.id;

  const [patient, setPatient] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPatientDetails();
  }, [patientId]);

  const fetchPatientDetails = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/admin/patients/${patientId}`);

      if (response.status === 401) {
        router.push('/admin/login');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch patient details');
      }

      const data = await response.json();
      setPatient(data.patient);
    } catch (err) {
      setError('Failed to load patient details. Please try again.');
      console.error('Error fetching patient:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading patient details...</p>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <DetailPageHeader title="Patient Not Found" subtitle="Go back and try again" icon={User} gradient={false} />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-400">Patient not found</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <DetailPageHeader
        title={`${patient.firstName} ${patient.lastName}`}
        subtitle="Patient Details & Settings"
        icon={User}
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

        {/* Patient Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Personal Information Card */}
          <InfoCardsGrid title="Personal Information" icon={User} color="blue">
            <InfoCard label="Email" value={patient.email} icon={Mail} color="blue" />
            <InfoCard label="Username" value={`@${patient.username || 'N/A'}`} color="blue" />
            <InfoCard
              label="Date of Birth"
              value={patient.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString() : 'N/A'}
              icon={Cake}
              color="blue"
            />
            <InfoCard label="Gender" value={patient.gender ? patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1) : 'N/A'} color="blue" />
          </InfoCardsGrid>

          {/* Account Information Card */}
          <InfoCardsGrid title="Account Information" icon={Users} color="purple">
            <InfoCard label="Account Status" value="Active" color="purple" />
            <InfoCard
              label="Joined Date"
              value={new Date(patient.createdAt).toLocaleDateString()}
              color="purple"
            />
            <InfoCard label="Provider Consent" value={patient.providerConsentStatus || 'N/A'} color="purple" />
            <InfoCard
              label="Last Sync"
              value={patient.lastSync ? new Date(patient.lastSync).toLocaleDateString() : 'Never'}
              color="purple"
            />
          </InfoCardsGrid>
        </div>

        {/* Biometrics Testing Tool */}
        <BiometricsTestingTool patientId={patientId} />
      </main>
    </div>
  );
}
