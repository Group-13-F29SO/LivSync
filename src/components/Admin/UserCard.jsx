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
      className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-xl transition-all duration-300 p-6 cursor-pointer border border-gray-200 dark:border-gray-700 hover:border-purple-400 dark:hover:border-purple-500 group"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
            {user.firstName} {user.lastName}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            @{user.username || user.email.split('@')[0]}
          </p>
        </div>
        <button
          onClick={handleDelete}
          className="delete-button p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors group/delete"
          aria-label="Delete user"
        >
          <svg 
            className="w-5 h-5 text-red-500 group-hover/delete:text-red-600 transition-colors" 
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

      <div className="space-y-2">
        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          {user.email}
        </div>

        {type === 'patients' && (
          <>
            {user.providerConsentStatus && (
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Provider Consent: <span className="ml-1 capitalize font-medium">{user.providerConsentStatus}</span>
              </div>
            )}
            
            <div className="grid grid-cols-3 gap-2 mt-3">
              <div className="bg-blue-50 dark:bg-blue-900/30 rounded p-2 text-center">
                <div className="text-lg font-bold text-blue-600 dark:text-blue-400">{user.biometricDataCount || 0}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Metrics</div>
              </div>
              <div className="bg-green-50 dark:bg-green-900/30 rounded p-2 text-center">
                <div className="text-lg font-bold text-green-600 dark:text-green-400">{user.goalsCount || 0}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Goals</div>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/30 rounded p-2 text-center">
                <div className="text-lg font-bold text-purple-600 dark:text-purple-400">{user.devicesCount || 0}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Devices</div>
              </div>
            </div>
          </>
        )}

        {type === 'providers' && (
          <>
            {user.specialty && (
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {user.specialty}
              </div>
            )}

            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center text-sm">
                <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  user.isVerified 
                    ? 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300' 
                    : 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300'
                }`}>
                  {user.isVerified ? '✓ Approved' : '⏳ Pending Approval'}
                </span>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-purple-600 dark:text-purple-400">{user.patientCount || 0}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Patients</div>
              </div>
            </div>

            {/* Approval Actions for Pending Providers */}
            {!user.isVerified && onApprove && onReject && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex gap-2">
                  <button
                    onClick={handleApprove}
                    className="action-button flex-1 flex items-center justify-center px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors text-sm font-medium"
                  >
                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Approve
                  </button>
                  <button
                    onClick={handleReject}
                    className="action-button flex-1 flex items-center justify-center px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors text-sm font-medium"
                  >
                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Reject
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        <div className="flex items-center text-sm text-gray-500 dark:text-gray-500 pt-2">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Joined {new Date(user.createdAt).toLocaleDateString()}
        </div>
      </div>

      {/* Only show "view details" footer if not showing approval buttons */}
      {!(type === 'providers' && !user.isVerified && onApprove && onReject) && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <span className="text-xs font-medium text-purple-600 dark:text-purple-400 group-hover:text-purple-700 dark:group-hover:text-purple-300">
            Click to view details →
          </span>
        </div>
      )}
    </div>
  );
}
