'use client';

export default function DeleteAllDataModal({
  isOpen,
  isDeleting,
  deleteError,
  onConfirm,
  onClose,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-md w-full border border-slate-200 dark:border-gray-800">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-gray-800">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Delete All Data
          </h2>
        </div>

        {/* Modal Body */}
        <div className="px-6 py-4">
          <div className="space-y-4">
            <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-sm text-red-800 dark:text-red-200 font-semibold mb-2">
                ⚠️ Warning
              </p>
              <p className="text-sm text-red-700 dark:text-red-300">
                This will permanently delete all your health data including biometric records, goals, achievements, notifications, and settings. Your account will remain active, but all associated data will be permanently removed.
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-gray-800 rounded-lg p-4">
              <p className="text-sm text-slate-700 dark:text-slate-300">
                This action <strong>cannot be undone</strong>. Please make sure you have backed up any important data before proceeding.
              </p>
            </div>

            {deleteError && (
              <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <p className="text-sm text-red-700 dark:text-red-300">
                  {deleteError}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-gray-800 flex gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 bg-slate-200 dark:bg-gray-800 text-slate-800 dark:text-slate-200 font-semibold rounded-lg hover:bg-slate-300 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 dark:hover:bg-red-800 transition-colors disabled:bg-red-400 disabled:cursor-not-allowed"
          >
            {isDeleting ? 'Deleting...' : 'Delete All Data'}
          </button>
        </div>
      </div>
    </div>
  );
}
