'use client';

import { useRouter } from 'next/navigation';

export default function UserCard({ user, type, onDelete }) {
  const router = useRouter();

  const handleCardClick = (e) => {
    // Don't navigate if clicking the delete button
    if (e.target.closest('.delete-button')) {
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

        {type === 'providers' && user.specialty && (
          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {user.specialty}
          </div>
        )}

        <div className="flex items-center text-sm text-gray-500 dark:text-gray-500">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Joined {new Date(user.createdAt).toLocaleDateString()}
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <span className="text-xs font-medium text-purple-600 dark:text-purple-400 group-hover:text-purple-700 dark:group-hover:text-purple-300">
          Click to view details →
        </span>
      </div>
    </div>
  );
}
