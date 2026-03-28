'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Loader, FileText, ArrowLeft } from 'lucide-react';
import PrescriptionsList from '@/components/Provider/PrescriptionsList';

export default function PatientPrescriptionsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [prescriptions, setPrescriptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (!authLoading && user?.userType !== 'patient') {
      router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  // Fetch prescriptions
  useEffect(() => {
    if (!user?.id) return;

    const fetchPrescriptions = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(
          `/api/patient/prescriptions?patientId=${user.id}`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch prescriptions');
        }

        const data = await response.json();
        setPrescriptions(data.prescriptions || []);
      } catch (error) {
        console.error('Error fetching prescriptions:', error);
        setPrescriptions([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPrescriptions();
  }, [user?.id]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950">
        <div className="flex flex-col items-center gap-3">
          <Loader size={32} className="text-blue-600 animate-spin" />
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <main className="p-6 md:p-8 pb-32">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => router.push('/dashboard')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ArrowLeft size={24} className="text-gray-600 dark:text-gray-400" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <FileText size={24} className="text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50">
                  My Prescriptions
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  View and download your prescriptions from your healthcare provider
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Prescriptions List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-3">
                <Loader size={32} className="text-blue-600 animate-spin" />
                <p className="text-gray-600 dark:text-gray-400">Loading prescriptions...</p>
              </div>
            </div>
          ) : (
            <PrescriptionsList
              prescriptions={prescriptions}
              providerId={user.id}
              isProvider={false}
            />
          )}
        </div>

        {/* Info Section */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 dark:text-blue-50 mb-2">
            About Your Prescriptions
          </h3>
          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
            <li>• You can view all prescriptions issued by your healthcare provider</li>
            <li>• Download prescriptions as PDF files for your records</li>
            <li>• Share prescriptions with other healthcare providers if needed</li>
            <li>• Active prescriptions are highlighted in green</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
