'use client';

import React, { forwardRef } from 'react';

const PrescriptionTemplate = forwardRef(({ prescription }, ref) => {
  if (!prescription) {
    return (
      <div className="text-center text-gray-500">
        No prescription data available
      </div>
    );
  }

  const { providers, patients, notes, issued_date, prescription_items } = prescription;
  const provider = providers;
  const patient = patients;

  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return null;
    return Math.floor(
      (new Date() - new Date(dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000)
    );
  };

  const age = patient?.patient_profiles?.date_of_birth 
    ? calculateAge(patient.patient_profiles.date_of_birth)
    : null;

  return (
    <div
      ref={ref}
      className="bg-white p-6 md:p-10 max-w-4xl m-auto"
      style={{ width: '210mm', height: '297mm' }}
    >
      {/* Header */}
      <div className="border-b-2 border-blue-600 pb-6 mb-8">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-3xl font-bold text-blue-600">Rx</h1>
            <p className="text-lg font-bold text-gray-900">LivSync Healthcare</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Prescription Date</p>
            <p className="font-semibold text-gray-900">
              {formatDate(issued_date)}
            </p>
          </div>
        </div>

        {/* Provider Information */}
        <div className="Grid grid-cols-2 gap-4 mt-4">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide">Prescriber</p>
            <p className="font-semibold text-gray-900 text-lg">
              Dr. {provider?.first_name} {provider?.last_name}
            </p>
            <p className="text-sm text-gray-700">{provider?.specialty}</p>
            {provider?.workplace_name && (
              <p className="text-sm text-gray-600">{provider?.workplace_name}</p>
            )}
            {provider?.work_phone && (
              <p className="text-sm text-gray-600">Tel: {provider?.work_phone}</p>
            )}
          </div>
        </div>
      </div>

      {/* Patient Information */}
      <div className="mb-8">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">
          Patient Information
        </h3>
        <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
          <div>
            <p className="text-xs text-gray-500">Name</p>
            <p className="font-semibold text-gray-900">
              {patient?.first_name} {patient?.last_name}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Email</p>
            <p className="font-semibold text-gray-900">{patient?.email}</p>
          </div>
          {patient?.patient_profiles?.date_of_birth && (
            <div>
              <p className="text-xs text-gray-500">Date of Birth</p>
              <p className="font-semibold text-gray-900">
                {formatDate(patient.patient_profiles.date_of_birth)}
                {age && ` (${age} years)`}
              </p>
            </div>
          )}
          {patient?.patient_profiles?.height_cm && (
            <div>
              <p className="text-xs text-gray-500">Height</p>
              <p className="font-semibold text-gray-900">
                {patient.patient_profiles.height_cm} cm
              </p>
            </div>
          )}
          {patient?.patient_profiles?.weight_kg && (
            <div>
              <p className="text-xs text-gray-500">Weight</p>
              <p className="font-semibold text-gray-900">
                {patient.patient_profiles.weight_kg} kg
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Prescription Details */}
      <div className="border-2 border-blue-200 rounded-lg p-6 mb-8">
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-4">
          Medicines
        </h3>

        {prescription_items && prescription_items.length > 0 ? (
          <div className="space-y-4">
            {prescription_items.map((item, index) => (
              <div key={item.id} className="border-l-4 border-blue-400 pl-4 py-2">
                <div className="grid grid-cols-3 gap-4 mb-2">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Medicine</p>
                    <p className="text-lg font-bold text-gray-900">{item.medicine_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Dosage</p>
                    <p className="font-semibold text-gray-900">{item.dosage}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Frequency</p>
                    <p className="font-semibold text-gray-900">{item.frequency}</p>
                  </div>
                </div>
                
                {item.duration && (
                  <div className="mb-2">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Duration</p>
                    <p className="text-gray-900">{item.duration}</p>
                  </div>
                )}

                {item.instructions && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Instructions</p>
                    <p className="text-sm text-gray-900 bg-yellow-50 p-2 rounded">
                      {item.instructions}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600">No medicines prescribed</p>
        )}

        {notes && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">General Notes</p>
            <p className="text-gray-900 text-sm">{notes}</p>
          </div>
        )}
      </div>

      {/* Signature Section */}
      <div className="mt-12">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-8">
            Prescriber Signature
          </p>
          <div className="border-t-2 border-gray-900 w-40 h-16"></div>
          <p className="text-sm font-semibold text-gray-900 mt-1">
            Dr. {provider?.first_name} {provider?.last_name}
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-gray-500 mt-8 pt-4 border-t border-gray-200">
        <p>This prescription was generated by LivSync Healthcare System</p>
        <p>Please keep a copy for your records</p>
      </div>
    </div>
  );
});

PrescriptionTemplate.displayName = 'PrescriptionTemplate';

export default PrescriptionTemplate;
