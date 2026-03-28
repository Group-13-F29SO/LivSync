'use client';

import { useEffect, useState, useRef } from 'react';
import { Download, Trash2, Edit2, Eye, Loader, AlertCircle } from 'lucide-react';
import PrescriptionTemplate from './PrescriptionTemplate';
import { exportPrescriptionToPDF } from '@/utils/prescriptionPDFExport';

export default function PrescriptionsList({ 
  prescriptions: initialPrescriptions,
  providerId,
  onEdit,
  onDelete,
  isProvider = true
}) {
  const [prescriptions, setPrescriptions] = useState(initialPrescriptions || []);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const prescriptionRefMap = useRef({});

  useEffect(() => {
    setPrescriptions(initialPrescriptions || []);
  }, [initialPrescriptions]);

  const handleExportPDF = async (prescription) => {
    try {
      setIsExporting(true);
      const templateRef = prescriptionRefMap.current[prescription.id];
      
      if (!templateRef) {
        throw new Error('Cannot access prescription template');
      }

      const patientName = `${prescription.patients.first_name} ${prescription.patients.last_name}`;
      await exportPrescriptionToPDF(templateRef, patientName, providerId);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('Failed to export prescription to PDF: ' + error.message);
    } finally {
      setIsExporting(false);
    }
  };

  const handlePreview = (prescription) => {
    setSelectedPrescription(prescription);
    setShowPreview(true);
  };

  const handleDelete = async (prescriptionId) => {
    if (window.confirm('Are you sure you want to delete this prescription?')) {
      try {
        const response = await fetch(
          `/api/provider/prescriptions/${prescriptionId}`,
          {
            method: 'DELETE',
          }
        );

        if (!response.ok) {
          throw new Error('Failed to delete prescription');
        }

        setPrescriptions(
          prescriptions.filter((p) => p.id !== prescriptionId)
        );
        onDelete?.(prescriptionId);
      } catch (error) {
        console.error('Error deleting prescription:', error);
        alert('Failed to delete prescription');
      }
    }
  };

  if (!prescriptions || prescriptions.length === 0) {
    return (
      <div className="text-center py-12">
        <AlertCircle size={48} className="mx-auto mb-3 text-gray-300 dark:text-gray-600" />
        <p className="text-gray-600 dark:text-gray-400">No prescriptions found</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {prescriptions.map((prescription) => (
          <div
            key={prescription.id}
            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 md:p-6 hover:shadow-lg transition-shadow"
          >
            {/* Hidden template for PDF export */}
            <div style={{ display: 'none' }}>
              <div
                ref={(el) => {
                  if (el) prescriptionRefMap.current[prescription.id] = el;
                }}
              >
                <PrescriptionTemplate prescription={prescription} />
              </div>
            </div>

            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50 mb-2">
                  {prescription.prescription_items && prescription.prescription_items.length > 0
                    ? `${prescription.prescription_items.length} Medicine${prescription.prescription_items.length !== 1 ? 's' : ''}`
                    : 'No medicines'}
                </h3>
                <div className="space-y-1">
                  {prescription.prescription_items && prescription.prescription_items.map((item) => (
                    <div key={item.id} className="text-sm text-gray-600 dark:text-gray-400">
                      <span className="font-medium">{item.medicine_name}</span>
                      <span className="text-gray-400 dark:text-gray-600"> • </span>
                      <span>{item.dosage}</span>
                      <span className="text-gray-400 dark:text-gray-600"> • </span>
                      <span>{item.frequency}</span>
                      {item.duration && (
                        <>
                          <span className="text-gray-400 dark:text-gray-600"> • </span>
                          <span>{item.duration}</span>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    prescription.status === 'active'
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400'
                  }`}
                >
                  {prescription.status === 'active' ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>

            {/* Patient Info (for provider view) */}
            {isProvider && (
              <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-semibold">Patient:</span>{' '}
                  {prescription.patients.first_name} {prescription.patients.last_name} ({
                  prescription.patients.email})
                </p>
              </div>
            )}

            {/* Provider Info (for patient view) */}
            {!isProvider && (
              <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-semibold">Prescribed by:</span> Dr.{' '}
                  {prescription.providers.first_name} {prescription.providers.last_name}{' '}
                  ({prescription.providers.specialty})
                </p>
              </div>
            )}

            {/* Instructions are now part of medicines, so removed from here */}

            {prescription.notes && (
              <div className="mb-4">
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-1">
                  Notes
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {prescription.notes}
                </p>
              </div>
            )}

            {/* Dates */}
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <span>
                Issued: {new Date(prescription.issued_date).toLocaleDateString()}
              </span>
              {prescription.expiry_date && (
                <span>
                  Expires: {new Date(prescription.expiry_date).toLocaleDateString()}
                </span>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => handlePreview(prescription)}
                className="px-3 py-2 flex items-center gap-2 text-sm bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
              >
                <Eye size={16} />
                Preview
              </button>

              <button
                onClick={() => handleExportPDF(prescription)}
                disabled={isExporting}
                className="px-3 py-2 flex items-center gap-2 text-sm bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded hover:bg-green-100 dark:hover:bg-green-900/40 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isExporting ? (
                  <Loader size={16} className="animate-spin" />
                ) : (
                  <Download size={16} />
                )}
                Export PDF
              </button>

              {isProvider && (
                <>
                  <button
                    onClick={() => onEdit?.(prescription)}
                    className="px-3 py-2 flex items-center gap-2 text-sm bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors"
                  >
                    <Edit2 size={16} />
                    Edit
                  </button>

                  <button
                    onClick={() => handleDelete(prescription.id)}
                    className="px-3 py-2 flex items-center gap-2 text-sm bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                  >
                    <Trash2 size={16} />
                    Delete
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Preview Modal */}
      {showPreview && selectedPrescription && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-50">
                Prescription Preview
              </h2>
              <button
                onClick={() => setShowPreview(false)}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>
            <div className="p-6 bg-gray-50 dark:bg-gray-900">
              <PrescriptionTemplate prescription={selectedPrescription} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
