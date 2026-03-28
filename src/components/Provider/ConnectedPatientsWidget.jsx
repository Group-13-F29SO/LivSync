'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Users, ChevronRight, Plus } from 'lucide-react';
import ConnectionRequestModal from '@/components/Provider/ConnectionRequestModal';

export default function ConnectedPatientsWidget({ providerId }) {
  const router = useRouter();
  const [patients, setPatients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchPatients = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/provider/get-patients?providerId=${providerId}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch patients');
      }

      const data = await response.json();
      // Filter to only show active/approved patients, then display first 5
      const activePatients = (data.patients || []).filter(p => p.connectionStatus === 'approved').slice(0, 5);
      setPatients(activePatients);
      setError(null);
    } catch (err) {
      console.error('Error fetching patients:', err);
      setError(err.message);
      setPatients([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (providerId) {
      fetchPatients();
    }
  }, [providerId]);

  const handlePatientClick = (patientId) => {
    router.push(`/provider/${patientId}`);
  };

  const handleViewAll = () => {
    router.push('/provider/patients');
  };

  const handleConnectPatient = () => {
    setIsModalOpen(true);
  };

  const handleConnectionSuccess = () => {
    setIsModalOpen(false);
    // Refresh patients list after successful connection
    fetchPatients();
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
        <p className="text-gray-600 dark:text-gray-400">Loading...</p>
      </div>
    );
  }

  return (
    <>
      <ConnectionRequestModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleConnectionSuccess}
        providerId={providerId}
      />
      
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 cursor-pointer hover:border-blue-300 dark:hover:border-blue-600 transition-colors" onClick={handleViewAll}>
      {/* Widget Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <Users size={20} className="text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
              Connected Patients
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {patients.length} patient{patients.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleConnectPatient();
          }}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          title="Add patient"
        >
          <Plus size={20} className="text-gray-400 dark:text-gray-500" />
        </button>
      </div>

      {/* Patients List */}
      {patients.length > 0 ? (
        <div className="space-y-3 mb-4">
          {patients.map((patient) => (
            <button
              key={patient.id}
              onClick={(e) => {
                e.stopPropagation();
                handlePatientClick(patient.id);
              }}
              className="w-full text-left p-3 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex items-center justify-between group"
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium text-gray-900 dark:text-gray-50 truncate">
                  {patient.name}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                  {patient.email}
                </p>
                {patient.lastSync !== null && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    Last sync: {patient.lastSync}
                  </p>
                )}
              </div>
              <ChevronRight
                size={20}
                className="text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-400 flex-shrink-0 ml-2 transition-colors"
              />
            </button>
          ))}
        </div>
      ) : (
        <div className="py-8 text-center mb-4">
          <Users size={32} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            No patients connected yet
          </p>
          <p className="text-gray-500 dark:text-gray-500 text-xs mt-2">
            Start by connecting with patients to view their health data
          </p>
        </div>
      )}
    </div>
    </>
  );
}
