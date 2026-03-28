'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Plus, ArrowLeft, Loader } from 'lucide-react';
import PrescriptionForm from '@/components/Provider/PrescriptionForm';
import PrescriptionsList from '@/components/Provider/PrescriptionsList';

export default function PrescriptionsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [prescriptions, setPrescriptions] = useState([]);
  const [patients, setPatients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedPatientFilter, setSelectedPatientFilter] = useState('all');
  const [editingPrescription, setEditingPrescription] = useState(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (!authLoading && user?.userType !== 'provider') {
      router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  // Fetch patients
  useEffect(() => {
    if (!user?.id) return;

    const fetchPatients = async () => {
      try {
        const response = await fetch(
          `/api/provider/get-patients?providerId=${user.id}`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch patients');
        }

        const data = await response.json();
        const activePatients = (data.patients || []).filter(
          (p) => p.connectionStatus === 'approved'
        );
        setPatients(activePatients);
      } catch (error) {
        console.error('Error fetching patients:', error);
      }
    };

    fetchPatients();
  }, [user?.id]);

  // Refetch prescriptions function
  const refetchPrescriptions = async () => {
    if (!user?.id) return;

    try {
      const url = selectedPatientFilter === 'all'
        ? `/api/provider/prescriptions?providerId=${user.id}`
        : `/api/provider/prescriptions?providerId=${user.id}&patientId=${selectedPatientFilter}`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Failed to fetch prescriptions');
      }

      const data = await response.json();
      setPrescriptions(data.prescriptions || []);
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
    }
  };

  // Fetch prescriptions
  useEffect(() => {
    if (!user?.id) return;

    const fetchPrescriptions = async () => {
      try {
        setIsLoading(true);
        const url = selectedPatientFilter === 'all'
          ? `/api/provider/prescriptions?providerId=${user.id}`
          : `/api/provider/prescriptions?providerId=${user.id}&patientId=${selectedPatientFilter}`;

        const response = await fetch(url);

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
  }, [user?.id, selectedPatientFilter]);

  const handleFormSuccess = (newPrescription) => {
    if (editingPrescription) {
      // Update existing prescription
      setPrescriptions(
        prescriptions.map((p) =>
          p.id === newPrescription.id ? newPrescription : p
        )
      );
      setEditingPrescription(null);
    } else {
      // Refetch prescriptions after creating a new one to ensure we have all data
      refetchPrescriptions();
    }
  };

  const handleEdit = (prescription) => {
    setEditingPrescription(prescription);
    setIsFormOpen(true);
  };

  const handleDelete = (prescriptionId) => {
    setPrescriptions(
      prescriptions.filter((p) => p.id !== prescriptionId)
    );
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingPrescription(null);
  };

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
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/provider')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <ArrowLeft size={24} className="text-gray-600 dark:text-gray-400" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50">
                Prescriptions
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Manage and create prescriptions for your patients
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setEditingPrescription(null);
              setIsFormOpen(true);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors"
          >
            <Plus size={20} />
            New Prescription
          </button>
        </div>

        {/* Filters */}
        <div className="mb-6 flex gap-4 items-center">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Filter by Patient
            </label>
            <select
              value={selectedPatientFilter}
              onChange={(e) => setSelectedPatientFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Patients</option>
              {patients.map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {patient.name}
                </option>
              ))}
            </select>
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
              onEdit={handleEdit}
              onDelete={handleDelete}
              isProvider={true}
            />
          )}
        </div>
      </main>

      {/* Prescription Form Modal */}
      {isFormOpen && (
        <PrescriptionForm
          patients={patients}
          providerId={user.id}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
          initialData={editingPrescription}
        />
      )}
    </div>
  );
}
