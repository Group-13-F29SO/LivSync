'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Navbar from '@/components/Navbar/Navbar';
import { useAuth } from '@/hooks/useAuth';
import { ArrowLeft, Heart, AlertCircle } from 'lucide-react';
import BiometricDataTab from '@/components/Provider/BiometricDataTab';
import CriticalEventsTab from '@/components/Provider/CriticalEventsTab';

export default function PatientDetailPage() {
  const router = useRouter();
  const { isLoading, user } = useAuth();
  const [activeTab, setActiveTab] = useState('biometric');
  const [patient, setPatient] = useState(null);

  // Sample patient data
  const samplePatient = {
    id: 1,
    name: 'John Anderson',
    age: 52,
    status: 'Connected',
    statusColor: 'green',
    lastSync: 12,
  };

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  useEffect(() => {
    // In a real app, fetch patient data based on ID
    setPatient(samplePatient);
  }, []);

  if (isLoading || !patient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950">
        <p className="text-gray-600 dark:text-gray-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-white dark:bg-gray-950">
      <Navbar />

      <main className="flex-1 p-8 ml-20 overflow-auto bg-blue-50 dark:bg-gray-950 text-gray-900 dark:text-gray-50">
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
              <p className="text-gray-500 dark:text-gray-400">Age: {patient.age}</p>
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
          {activeTab === 'biometric' && <BiometricDataTab />}
          {activeTab === 'critical' && <CriticalEventsTab />}
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
