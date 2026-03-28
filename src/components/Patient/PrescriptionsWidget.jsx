'use client';

import React, { useState, useEffect } from 'react';
import { Pill, AlertCircle, Loader, ExternalLink } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';

export default function PrescriptionsWidget() {
  const { user } = useAuth();
  const router = useRouter();
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const navigateToPrescriptions = () => {
    router.push('/patient/prescriptions');
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      navigateToPrescriptions();
    }
  };

  useEffect(() => {
    if (user?.id && user?.userType === 'patient') {
      fetchPrescriptions();
    }
  }, [user]);

  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch(`/api/patient/prescriptions?patientId=${user.id}`);

      if (!response.ok) {
        throw new Error('Failed to fetch prescriptions');
      }

      const data = await response.json();
      const fetchedPrescriptions = Array.isArray(data) ? data : data.prescriptions || [];
      setPrescriptions(fetchedPrescriptions);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching prescriptions:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (inputDate) => {
    try {
      const date = new Date(inputDate);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return inputDate;
    }
  };

  const issuedPrescriptions = prescriptions
    .filter((rx) => rx.status === 'active' || !rx.status)
    .sort((a, b) => new Date(b.issued_date) - new Date(a.issued_date))
    .slice(0, 3); // Show only latest 3 prescriptions

  const renderMedicineNames = (prescription) => {
    const medicineNames = prescription.prescription_items
      ?.map((item) => item.medicine_name?.trim())
      .filter(Boolean) || [];

    if (medicineNames.length === 0) {
      return 'Prescription';
    }

    return medicineNames.join(' • ');
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-lg p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Pill className="w-5 h-5 text-green-600 dark:text-green-400" />
          Active Prescriptions
        </h2>
        <div className="flex justify-center items-center py-8">
          <Loader className="w-6 h-6 text-green-600 dark:text-green-400 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={navigateToPrescriptions}
      onKeyDown={handleKeyDown}
      className="bg-white dark:bg-gray-900 rounded-lg p-6 shadow-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900"
    >
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2 pointer-events-none">
        <Pill className="w-5 h-5 text-green-600 dark:text-green-400" />
        Active Prescriptions
      </h2>

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {issuedPrescriptions.length === 0 ? (
        <div className="text-center py-8">
          <Pill className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
          <p className="text-gray-600 dark:text-gray-400">No active prescriptions</p>
        </div>
      ) : (
        <div className="space-y-3">
          {issuedPrescriptions.map((prescription) => (
            <div
              key={prescription.id}
              role="button"
              tabIndex={0}
              onClick={navigateToPrescriptions}
              onKeyDown={handleKeyDown}
              className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-800"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-gray-900 dark:text-white truncate">
                      {renderMedicineNames(prescription)}
                    </p>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Dr. {prescription.providers?.first_name || ''} {prescription.providers?.last_name || ''}
                  </p>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    <p>Issued: {formatDate(prescription.issued_date)}</p>
                    {prescription.expiry_date && (
                      <p>Expires: {formatDate(prescription.expiry_date)}</p>
                    )}
                  </div>
                </div>
                <span className="px-3 py-1 text-xs font-medium rounded-full whitespace-nowrap bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400">
                  Active
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={navigateToPrescriptions}
        className="mt-4 w-full px-4 py-2 text-sm font-medium text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        <ExternalLink className="w-4 h-4" />
        View All Prescriptions
      </button>
    </div>
  );
}
