'use client';

import { useRouter } from 'next/navigation';

export default function UserCard({ user, type, onDelete, onApprove, onReject }) {
  const router = useRouter();

  const handleCardClick = (e) => {
    // Don't navigate if clicking action buttons
    if (e.target.closest('.action-button') || e.target.closest('.delete-button')) {
      return;
    }
    router.push(`/admin/${type}/${user.id}`);
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    
    const confirmMessage = type === 'patients' 
      ? `Are you sure you want to delete patient ${user.firstName} ${user.lastName}?`
      : `Are you sure you want to delete provider ${user.firstName} ${user.lastName}?`;
    
    if (window.confirm(confirmMessage)) {
      onDelete(user.id);
    }
  };

  const handleApprove = async (e) => {
    e.stopPropagation();
    if (onApprove) {
      onApprove(user.id);
    }
  };

  const handleReject = async (e) => {
    e.stopPropagation();
    const confirmMessage = `Are you sure you want to reject ${user.firstName} ${user.lastName}'s provider application? This will permanently delete their account.`;
    
    if (window.confirm(confirmMessage)) {
      if (onReject) {
        onReject(user.id);
      }
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-xl transition-all duration-300 p-4 cursor-pointer border border-gray-200 dark:border-gray-700 hover:border-purple-400 dark:hover:border-purple-500 group"
    >
      {/* Header with name and delete button */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            {user.firstName} {user.lastName}
          </h3>
        </div>
        <button
          onClick={handleDelete}
          className="delete-button p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors group/delete flex-shrink-0"
          aria-label="Delete user"
        >
          <svg 
            className="w-4 h-4 text-red-500 group-hover/delete:text-red-600 transition-colors" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" 
            />
          </svg>
        </button>
      </div>

      {/* Email and username on one line */}
      <div className="flex items-center gap-2 mb-2 text-xs text-gray-600 dark:text-gray-400">
        <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        <span className="truncate">{user.email}</span>
      </div>

      {/* Type-specific content */}
      {type === 'patients' && (
        <div className="space-y-1.5">
          {user.providerConsentStatus && (
            <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
              <span className="truncate">Consent: <span className="font-medium capitalize">{user.providerConsentStatus}</span></span>
            </div>
          )}
          <div className="flex items-center text-xs text-gray-500 dark:text-gray-500">
            <svg className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {new Date(user.createdAt).toLocaleDateString()}
          </div>
        </div>
      )}

      {type === 'providers' && (
        <div className="space-y-1.5">
          {user.specialty && (
            <div className="flex items-center text-xs text-gray-600 dark:text-gray-400">
              <svg className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="truncate">{user.specialty}</span>
            </div>
          )}

          {/* Status and patient count on one line */}
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className={`inline-flex px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${
              user.isVerified 
                ? 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300' 
                : 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300'
            }`}>
              {user.isVerified ? '✓ Approved' : '⏳ Pending'}
            </span>
            <div className="text-center">
              <div className="font-bold text-purple-600 dark:text-purple-400">{user.patientCount || 0}</div>
              <div className="text-gray-500 dark:text-gray-500 leading-none">patients</div>
            </div>
          </div>

          {/* Approval Actions for Pending Providers */}
          {!user.isVerified && onApprove && onReject && (
            <div className="flex gap-2 pt-2">
              <button
                onClick={handleApprove}
                className="action-button flex-1 px-2 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded text-xs font-medium transition-colors"
              >
                Approve
              </button>
              <button
                onClick={handleReject}
                className="action-button flex-1 px-2 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded text-xs font-medium transition-colors"
              >
                Reject
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
