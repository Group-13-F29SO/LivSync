'use client';

export default function ProviderDeleteAccountModal({
  isOpen,
  deleteStep,
  deleteCredentials,
  onCredentialsChange,
  isDeleting,
  deleteError,
  onVerifyCredentials,
  onConfirmDelete,
  onClose,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-md w-full border border-slate-200 dark:border-gray-800">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-gray-800">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            {deleteStep === 1 ? 'Verify Your Identity' : 'Confirm Account Deletion'}
          </h2>
        </div>

        {/* Modal Body */}
        <div className="px-6 py-4">
          {deleteStep === 1 ? (
            <div className="space-y-4">
              <p className="text-slate-600 dark:text-slate-400 text-sm">
                Enter your credentials to verify your identity before deleting your account.
              </p>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={deleteCredentials.username}
                  onChange={(e) => onCredentialsChange({ ...deleteCredentials, username: e.target.value })}
                  placeholder="Enter your email address"
                  disabled={isDeleting}
                  className="w-full px-4 py-2 bg-slate-100 dark:bg-gray-800 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  value={deleteCredentials.password}
                  onChange={(e) => onCredentialsChange({ ...deleteCredentials, password: e.target.value })}
                  placeholder="Enter your password"
                  disabled={isDeleting}
                  className="w-full px-4 py-2 bg-slate-100 dark:bg-gray-800 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                />
              </div>

              {deleteError && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
                  {deleteError}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-700 dark:text-red-200 font-semibold text-sm mb-2">
                  ⚠️ Warning: This action is permanent and irreversible
                </p>
                <p className="text-red-600 dark:text-red-300 text-sm">
                  This will permanently delete your account and all associated data, including:
                </p>
                <ul className="text-red-600 dark:text-red-300 text-sm mt-2 ml-4 space-y-1">
                  <li>• Your profile information</li>
                  <li>• All appointments and reminders</li>
                  <li>• All prescriptions</li>
                  <li>• All patient connections</li>
                  <li>• All notifications</li>
                </ul>
              </div>

              <p className="text-slate-600 dark:text-slate-400 text-sm font-semibold">
                Are you absolutely sure you want to continue?
              </p>

              {deleteError && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
                  {deleteError}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-gray-800 flex gap-3 justify-end">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-gray-800 rounded-lg hover:bg-slate-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 font-medium"
          >
            Cancel
          </button>
          {deleteStep === 1 ? (
            <button
              onClick={onVerifyCredentials}
              disabled={isDeleting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 font-medium"
            >
              {isDeleting ? 'Verifying...' : 'Verify'}
            </button>
          ) : (
            <button
              onClick={onConfirmDelete}
              disabled={isDeleting}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 font-medium"
            >
              {isDeleting ? 'Deleting...' : 'Delete Account'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
