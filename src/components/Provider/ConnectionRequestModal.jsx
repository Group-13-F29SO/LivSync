'use client';

import { useState } from 'react';
import { X, Search, AlertCircle } from 'lucide-react';

export default function ConnectionRequestModal({ isOpen, onClose, onSuccess, providerId }) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [patient, setPatient] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [success, setSuccess] = useState('');

  const handleSearch = async () => {
    if (!email.trim()) {
      setError('Please enter a valid email');
      return;
    }

    setIsLoading(true);
    setError('');
    setPatient(null);

    try {
      const response = await fetch(
        `/api/provider/search-patient?providerId=${providerId}&email=${encodeURIComponent(email)}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to search patient');
      }

      const data = await response.json();

      if (!data.patient) {
        setError('No patient found with this email');
      } else {
        setPatient(data.patient);
      }
    } catch (err) {
      setError(err.message || 'An error occurred while searching');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if (!patient) return;

    setIsSending(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/provider/send-connection-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerId,
          email: patient.email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send connection request');
      }

      setSuccess('Connection request sent successfully!');
      setTimeout(() => {
        resetForm();
        onClose();
        if (onSuccess) {
          onSuccess();
        }
      }, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSending(false);
    }
  };

  const resetForm = () => {
    setEmail('');
    setPatient(null);
    setError('');
    setSuccess('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={handleClose}
      ></div>

      {/* Modal Container */}
      <div className="relative bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-md w-full mx-4 p-8">
        
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">
            Connect Patient
          </h2>
          <button
            onClick={handleClose}
            className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
            aria-label="Close modal"
          >
            <X size={24} />
          </button>
        </div>

        {/* Search Section */}
        <div className="mb-6">
          <p className="text-slate-600 dark:text-slate-300 text-sm mb-4">
            Enter the patient's email address to send them a connection request. They will need to review and accept your request.
          </p>

          {/* Search Input */}
          <div className="flex gap-2">
            <input
              type="email"
              placeholder="patient@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !patient && handleSearch()}
              disabled={!!patient}
              className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-slate-50 placeholder-slate-500 dark:placeholder-slate-400 rounded-lg border border-slate-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:focus:ring-indigo-500 transition-colors disabled:opacity-50"
            />
            {!patient && (
              <button
                onClick={handleSearch}
                disabled={isLoading}
                className="px-4 py-3 bg-indigo-400 hover:bg-indigo-500 disabled:bg-indigo-300 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
              >
                <Search size={18} />
                {isLoading ? 'Searching...' : 'Search'}
              </button>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex items-start gap-2 mb-4 p-3 bg-red-100 dark:bg-red-900/30 rounded-lg text-red-700 dark:text-red-400 text-sm">
            <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="flex items-start gap-2 mb-4 p-3 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-700 dark:text-green-400 text-sm">
            <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Patient Result */}
        {patient && (
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="mb-2">
              <p className="text-sm text-slate-600 dark:text-slate-400">Selected Patient:</p>
              <p className="font-semibold text-slate-900 dark:text-slate-50">
                {patient.firstName} {patient.lastName}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">{patient.email}</p>
            </div>

            {patient.isConnected && (
              <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                ✓ Already connected to you
              </p>
            )}

            {patient.hasPendingRequest && (
              <p className="text-sm text-orange-600 dark:text-orange-400 font-medium">
                ⏳ Request already pending
              </p>
            )}

            {!patient.isConnected && !patient.hasPendingRequest && (
              <button
                onClick={() => {
                  setEmail('');
                  setPatient(null);
                  setError('');
                  setSuccess('');
                }}
                className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Search again
              </button>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 justify-end">
          <button
            onClick={handleClose}
            className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-50 font-medium rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
          >
            Cancel
          </button>
          {patient && !patient.isConnected && !patient.hasPendingRequest && (
            <button
              onClick={handleSend}
              disabled={isSending}
              className="px-4 py-2 bg-gradient-to-r from-indigo-400 to-purple-500 hover:from-indigo-500 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-all"
            >
              {isSending ? 'Sending...' : 'Send Request'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

