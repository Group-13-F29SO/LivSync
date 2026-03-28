'use client';

import { useRouter } from 'next/navigation';
import { AlertCircle } from 'lucide-react';
import { useState } from 'react';

export default function PatientCard({ patient, onDisconnect, providerId }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const getStatusColor = (color) => {
    switch (color) {
      case 'red':
        return 'bg-red-500';
      case 'orange':
        return 'bg-orange-400';
      case 'green':
        return 'bg-green-500';
      default:
        return 'bg-gray-400';
    }
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(n => n.charAt(0))
      .join('')
      .toUpperCase();
  };

  const handleCardClick = (e) => {
    // Prevent navigation if revoked or clicking the button
    if (patient.status === 'Revoked') {
      return;
    }
    if (!e.target.closest('button')) {
      router.push(`/provider/${patient.id}`);
    }
  };

  const handleButtonClick = async () => {
    try {
      setIsLoading(true);
      const isRevoked = patient.status === 'Revoked';
      const endpoint = isRevoked 
        ? '/api/provider/dismiss-patient'
        : '/api/provider/disconnect-patient';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          providerId: providerId || patient.providerId,
          patientId: patient.id,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to ${isRevoked ? 'dismiss' : 'disconnect'} patient`);
      }

      // Always call onDisconnect to refresh the patient list
      // For disconnect: shows card with updated "Revoked" status
      // For dismiss: removes card entirely
      onDisconnect(patient.id);
    } catch (error) {
      console.error('Error:', error);
      // Handle error silently or show a toast notification
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      onClick={handleCardClick}
      className="cursor-pointer bg-white dark:bg-gray-800 rounded-2xl p-6 flex items-start gap-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg dark:hover:shadow-gray-900/50 transition-shadow">
      
      {/* Status Indicator */}
      <div className={`w-3 h-3 rounded-full mt-2 flex-shrink-0 ${getStatusColor(patient.statusColor)}`}></div>

      {/* Profile Avatar */}
      <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center flex-shrink-0">
        <span className="text-sm font-semibold text-blue-900 dark:text-blue-100">
          {getInitials(patient.name)}
        </span>
      </div>

      {/* Patient Info */}
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-1">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-50">
            {patient.name}
          </h3>
          <span className={`px-2 py-1 ${
            patient.status === 'Active' 
              ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100' 
              : patient.status === 'Revoked'
              ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100'
              : 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-100'
          } text-xs font-semibold rounded-full flex items-center gap-1`}>
            <span className={`w-1.5 h-1.5 rounded-full ${
              patient.status === 'Active' 
                ? 'bg-green-600 dark:bg-green-400' 
                : patient.status === 'Revoked'
                ? 'bg-red-600 dark:bg-red-400'
                : 'bg-orange-600 dark:bg-orange-400'
            }`}></span>
            {patient.status}
          </span>
        </div>

        {/* Demographics */}
        <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
          {patient.age && (
            <>
              <span>Age: {patient.age}</span>
              <span className="mx-2">•</span>
            </>
          )}
          <span>
            Last sync: {patient.lastSync !== null ? patient.lastSync : 'Never'}
          </span>
        </div>

        {/* Alert Message */}
        {patient.alert && (
          <div className="flex items-start gap-2 mt-2 text-red-600 dark:text-red-400 text-sm">
            <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
            <span>{patient.alert.message}</span>
          </div>
        )}
      </div>

      {/* Disconnect/Dismiss Button */}
      <button
        onClick={handleButtonClick}
        disabled={isLoading}
        className={`font-medium transition-colors flex-shrink-0 ${
          patient.status === 'Revoked'
            ? 'text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 disabled:opacity-50'
            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 disabled:opacity-50'
        }`}
      >
        {isLoading ? 'Loading...' : patient.status === 'Revoked' ? 'Dismiss' : 'Disconnect'}
      </button>
    </div>
  );
}
