'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { ArrowLeft, Heart, AlertCircle } from 'lucide-react';
import BiometricDataTab from '@/components/Provider/BiometricDataTab';
import CriticalEventsTab from '@/components/Provider/CriticalEventsTab';

export default function PatientDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { isLoading, user } = useAuth();
  const [activeTab, setActiveTab] = useState('critical');
  const [patient, setPatient] = useState(null);
  const [patientLoading, setPatientLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
    // Only allow providers to access this page
    if (!isLoading && user && user.userType !== 'provider') {
      router.push('/dashboard');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    const fetchPatientData = async () => {
      try {
        setPatientLoading(true);
        const patientId = params.id;
        
        const response = await fetch(
          `/api/provider/patient-details?patientId=${patientId}`
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch patient data');
        }

        const data = await response.json();
        setPatient(data.patient);
        setError(null);
      } catch (err) {
        console.error('Error fetching patient data:', err);
        setError(err.message);
        setPatient(null);
      } finally {
        setPatientLoading(false);
      }
    };

    if (!isLoading && user && params.id) {
      fetchPatientData();
    }
  }, [isLoading, user, params.id]);

  if (isLoading || patientLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950">
        <p className="text-gray-600 dark:text-gray-400">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950">
        <div className="text-center">
          <AlertCircle size={48} className="mx-auto text-red-500 mb-4" />
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950">
        <div className="text-center">
          <AlertCircle size={48} className="mx-auto text-red-500 mb-4" />
          <p className="text-gray-600 dark:text-gray-400 mb-4">Patient not found</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <main className="p-8 overflow-auto bg-blue-50 dark:bg-gray-950 text-gray-900 dark:text-gray-50">
        {/* Header Section */}
        <div className="flex justify-between items-start mb-8">
          <div className="flex items-start gap-4">
            {/* Back Button */}
            <button
              onClick={() => router.back()}
              className="mt-1 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft size={24} />
            </button>

            {/* Patient Info */}
            <div>
              <h1 className="inline-block text-3xl font-bold bg-gradient-to-r from-indigo-400 to-purple-500 bg-clip-text text-transparent mb-2">
                {patient.name}
              </h1>
              <p className="text-gray-500 dark:text-gray-400">
                {patient.age && `Age: ${patient.age}`}
                {patient.lastSync && ` • Last sync: ${patient.lastSync}${patient.lastSync === 'just now' ? '' : ' ago'}`}
              </p>
            </div>
          </div>

          {/* Connection Status Badge */}
          <div className="flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900 rounded-full">
            <Heart size={16} className="text-green-600 dark:text-green-400 fill-current animate-pulse" />
            <span className="text-green-800 dark:text-green-100 font-semibold text-sm">
              {patient.status}
            </span>
          </div>
        </div>

        {/* Navigation Tabs - Floating Navbar */}
        <div className="flex gap-2 mb-8 bg-orange-100/30 dark:bg-orange-950/5 rounded-3xl p-2 w-full">
          {[
            { id: 'critical', label: 'Critical Events' },
            { id: 'biometric', label: 'Biometric Data' },
            { id: 'manual', label: 'Manual Entries' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 font-semibold rounded-2xl transition-all ${
                activeTab === tab.id
                  ? 'bg-blue-50 dark:bg-gray-900 text-gray-900 dark:text-gray-50 ring-2 ring-blue-100 dark:ring-gray-800'
                  : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'biometric' && <BiometricDataTab patientId={params.id} />}
          {activeTab === 'critical' && <CriticalEventsTab patientId={params.id} />}
          {activeTab === 'manual' && (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <p>Manual Entries tab coming soon</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
