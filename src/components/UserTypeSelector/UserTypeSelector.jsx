'use client';

export default function UserTypeSelector({ userType, onUserTypeChange }) {
  return (
    <div className="mb-8">
      <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 via-purple-500 to-pink-600 bg-clip-text text-transparent text-center" style={{paddingBottom: '8px'}}>
        Welcome to LivSync
      </h1>
      <p className="text-center text-gray-600 mb-8 text-sm">
        Are you a patient or a healthcare provider?
      </p>

      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => onUserTypeChange('patient')}
          className={`p-4 rounded-lg border-2 transition-all ${
            userType === 'patient'
              ? 'border-purple-500 bg-purple-50 dark:bg-purple-950 dark:bg-opacity-40'
              : 'border-gray-300 dark:border-gray-600 hover:border-purple-300 dark:hover:border-purple-400'
          }`}
        >
          <div className="flex flex-col items-center gap-2">
            <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="font-semibold text-gray-800 dark:text-gray-100">Patient</span>
          </div>
        </button>

        <button
          onClick={() => onUserTypeChange('provider')}
          className={`p-4 rounded-lg border-2 transition-all ${
            userType === 'provider'
              ? 'border-purple-500 bg-purple-50 dark:bg-purple-950 dark:bg-opacity-40'
              : 'border-gray-300 dark:border-gray-600 hover:border-purple-300 dark:hover:border-purple-400'
          }`}
        >
          <div className="flex flex-col items-center gap-2">
            <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            <span className="font-semibold text-gray-800 dark:text-gray-100">Provider</span>
          </div>
        </button>
      </div>
    </div>
  );
}
