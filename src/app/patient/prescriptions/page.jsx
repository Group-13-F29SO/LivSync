'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { FileText, Download, Loader, AlertCircle, ChevronDown } from 'lucide-react';
import PrescriptionTemplate from '@/components/Provider/PrescriptionTemplate';
import { exportPrescriptionToPDF } from '@/utils/prescriptionPDFExport';
import { useRef } from 'react';

export default function PatientPrescriptionsPage() {
  const { user } = useAuth();
  const [providers, setProviders] = useState([]);
  const [prescriptionsByProvider, setPrescriptionsByProvider] = useState({});
  const [expandedProvider, setExpandedProvider] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const prescriptionRefMap = useRef({});

  useEffect(() => {
    if (!user?.id) return;
    fetchProvidersAndPrescriptions();
  }, [user?.id]);

  const fetchProvidersAndPrescriptions = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch connected providers
      const providersRes = await fetch(
        `/api/patient/providers?patientId=${user.id}`
      );
      if (!providersRes.ok) {
        throw new Error('Failed to fetch providers');
      }
      const { providers: fetchedProviders } = await providersRes.json();
      setProviders(fetchedProviders);

      // Fetch prescriptions for each provider
      const prescriptionsData = {};
      for (const provider of fetchedProviders) {
        const prescResRes = await fetch(
          `/api/patient/prescriptions?patientId=${user.id}&providerId=${provider.id}`
        );
        if (prescResRes.ok) {
          const { prescriptions } = await prescResRes.json();
          prescriptionsData[provider.id] = prescriptions;
        }
      }
      setPrescriptionsByProvider(prescriptionsData);

      // Expand first provider by default
      if (fetchedProviders.length > 0) {
        setExpandedProvider(fetchedProviders[0].id);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportPDF = async (prescription) => {
    try {
      setIsExporting(true);
      const templateRef = prescriptionRefMap.current[prescription.id];

      if (!templateRef) {
        throw new Error('Cannot access prescription template');
      }

      const patientName = `${prescription.patients.first_name} ${prescription.patients.last_name}`;
      await exportPrescriptionToPDF(templateRef, patientName, user.id);
    } catch (err) {
      console.error('Error exporting PDF:', err);
      alert('Failed to export prescription: ' + err.message);
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="animate-spin text-blue-600" size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-950 dark:to-purple-950/20 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header with Colored Background */}
        <div className="mb-8 bg-gradient-to-r from-indigo-500 to-purple-500 dark:from-indigo-600 dark:to-purple-600 rounded-2xl p-8 text-white shadow-lg">
          <h1 className="text-3xl font-bold text-white mb-2">
            💊 My Prescriptions
          </h1>
          <p className="text-indigo-100">
            View and download prescriptions from your connected providers
          </p>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-3 shadow-md">
            <AlertCircle className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <h3 className="font-semibold text-red-800 dark:text-red-300">Error</h3>
              <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* No Providers State */}
        {providers.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center shadow-lg border border-indigo-100 dark:border-indigo-900/30">
            <FileText size={48} className="mx-auto mb-4 text-gray-300 dark:text-gray-600" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-50 mb-2">
              No Connected Providers
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              You haven't connected with any providers yet. Connect with a provider to view their prescriptions.
            </p>
            <a
              href="/chat"
              className="inline-block px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl hover:from-indigo-600 hover:to-purple-600 transition-all font-semibold shadow-md"
            >
              Browse Providers
            </a>
          </div>
        ) : (
          <div className="space-y-4">
            {providers.map((provider) => (
              <div
                key={provider.id}
              className="bg-white dark:bg-gray-800 rounded-xl border-2 border-indigo-100 dark:border-indigo-900/30 overflow-hidden shadow-md hover:shadow-lg transition-shadow"
            >
                {/* Provider Card Header */}
                <button
                  onClick={() =>
                    setExpandedProvider(
                      expandedProvider === provider.id ? null : provider.id
                    )
                  }
                  className="w-full p-6 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition-colors flex items-center justify-between border-b-2 border-indigo-100 dark:border-indigo-900/20"
                >
                  <div className="flex-1 text-left">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-50">
                      Dr. {provider.first_name} {provider.last_name}
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {provider.specialty}
                      {provider.workplace_name && ` • ${provider.workplace_name}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                      {prescriptionsByProvider[provider.id]?.length || 0}{' '}
                      {prescriptionsByProvider[provider.id]?.length === 1
                        ? 'Prescription'
                        : 'Prescriptions'}
                    </span>
                    <ChevronDown
                      size={20}
                      className={`text-gray-400 transition-transform ${
                        expandedProvider === provider.id ? 'rotate-180' : ''
                      }`}
                    />
                  </div>
                </button>

                {/* Provider Prescriptions */}
                {expandedProvider === provider.id && (
                  <div className="p-6 bg-indigo-50/50 dark:bg-gray-700/30 space-y-4">
                    {prescriptionsByProvider[provider.id]?.length > 0 ? (
                      prescriptionsByProvider[provider.id].map((prescription) => (
                        <div
                          key={prescription.id}
                          className="bg-white dark:bg-gray-800 rounded-lg p-4 border-2 border-indigo-200 dark:border-indigo-900/30 shadow-sm hover:shadow-md transition-shadow"
                        >
                          {/* Hidden template for PDF */}
                          <div style={{ display: 'none' }}>
                            <div
                              ref={(el) => {
                                if (el)
                                  prescriptionRefMap.current[prescription.id] = el;
                              }}
                            >
                              <PrescriptionTemplate prescription={prescription} />
                            </div>
                          </div>

                          <div className="flex items-center justify-between mb-3">
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900 dark:text-gray-50">
                                {prescription.prescription_items?.length || 0}{' '}
                                {prescription.prescription_items?.length === 1
                                  ? 'Medicine'
                                  : 'Medicines'}
                              </h4>
                              <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1 mt-1">
                                {prescription.prescription_items?.map(
                                  (item) => (
                                    <div key={item.id}>
                                      <span className="font-medium">{item.medicine_name}</span>
                                      <span className="text-gray-400"> • </span>
                                      <span>{item.dosage}</span>
                                      <span className="text-gray-400"> • </span>
                                      <span>{item.frequency}</span>
                                    </div>
                                  )
                                )}
                              </div>
                            </div>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                prescription.status === 'active'
                                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400'
                              }`}
                            >
                              {prescription.status === 'active'
                                ? 'Active'
                                : 'Inactive'}
                            </span>
                          </div>

                          {prescription.notes && (
                            <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded text-sm text-gray-700 dark:text-gray-300 border border-blue-200 dark:border-blue-800">
                              <p className="font-semibold text-blue-900 dark:text-blue-300 mb-1">
                                Notes
                              </p>
                              <p>{prescription.notes}</p>
                            </div>
                          )}

                          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                            <span>
                              Issued:{' '}
                              {new Date(
                                prescription.issued_date
                              ).toLocaleDateString()}
                            </span>
                            {prescription.expiry_date && (
                              <span>
                                Expires:{' '}
                                {new Date(
                                  prescription.expiry_date
                                ).toLocaleDateString()}
                              </span>
                            )}
                          </div>

                          <button
                            onClick={() => handleExportPDF(prescription)}
                            disabled={isExporting}
                            className="w-full px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg hover:from-indigo-600 hover:to-purple-600 disabled:from-indigo-400 disabled:to-purple-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all text-sm font-medium shadow-md"
                          >
                            {isExporting ? (
                              <Loader size={16} className="animate-spin" />
                            ) : (
                              <Download size={16} />
                            )}
                            Download PDF
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <FileText
                          size={32}
                          className="mx-auto mb-2 text-gray-300 dark:text-gray-600"
                        />
                        <p className="text-gray-600 dark:text-gray-400">
                          No prescriptions from this provider
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
