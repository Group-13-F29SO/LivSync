'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, ChevronRight, Plus } from 'lucide-react';

export default function PrescriptionsWidget({ providerId }) {
  const router = useRouter();
  const [recentPrescriptions, setRecentPrescriptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPrescriptions = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(
          `/api/provider/prescriptions?providerId=${providerId}`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch prescriptions');
        }

        const data = await response.json();
        // Show only the 5 most recent prescriptions
        const recent = (data.prescriptions || [])
          .sort(
            (a, b) =>
              new Date(b.issued_date) - new Date(a.issued_date)
          )
          .slice(0, 5);
        setRecentPrescriptions(recent);
        setError(null);
      } catch (err) {
        console.error('Error fetching prescriptions:', err);
        setError(err.message);
        setRecentPrescriptions([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (providerId) {
      fetchPrescriptions();
    }
  }, [providerId]);

  const handleViewAll = () => {
    router.push('/provider/prescriptions');
  };

  const handleNewPrescription = () => {
    router.push('/provider/prescriptions');
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
        <p className="text-gray-600 dark:text-gray-400 text-sm">Loading...</p>
      </div>
    );
  }

  return (
    <div
      className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 cursor-pointer hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
      onClick={handleViewAll}
    >
      {/* Widget Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
          <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
            <FileText size={20} className="text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
              Prescriptions
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {recentPrescriptions.length} recent
            </p>
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleNewPrescription();
          }}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          title="Create new prescription"
        >
          <Plus size={20} className="text-gray-400 dark:text-gray-500" />
        </button>
      </div>

      {/* Prescriptions List */}
      {recentPrescriptions.length > 0 ? (
        <div className="space-y-3 mb-4">
          {recentPrescriptions.map((prescription) => (
            <button
              key={prescription.id}
              onClick={(e) => {
                e.stopPropagation();
                handleViewAll();
              }}
              className="w-full text-left p-3 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex items-center justify-between group"
            >
              <div className="min-w-0 flex-1">
                <p className="font-medium text-gray-900 dark:text-gray-50 truncate">
                  {prescription.medicine_name}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                  {prescription.patients.first_name} {prescription.patients.last_name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  {new Date(prescription.issued_date).toLocaleDateString()}
                </p>
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
          <FileText size={32} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            No prescriptions yet
          </p>
          <p className="text-gray-500 dark:text-gray-500 text-xs mt-2">
            Create prescriptions for your patients
          </p>
        </div>
      )}

      {/* View All Button */}
      <button
        onClick={handleViewAll}
        className="w-full mt-4 py-2 text-center text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        View All Prescriptions
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
