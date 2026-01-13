'use client';

export function PrimaryButton({ children, onClick, disabled = false }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 dark:hover:bg-blue-800 transition-colors disabled:bg-slate-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed"
    >
      {children}
    </button>
  );
}

export function SecondaryButton({ children, onClick, disabled = false }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="px-6 py-2 bg-slate-200 dark:bg-gray-800 text-slate-800 dark:text-slate-200 font-semibold rounded-lg hover:bg-slate-300 dark:hover:bg-gray-700 transition-colors disabled:bg-slate-100 dark:disabled:bg-gray-900 disabled:cursor-not-allowed"
    >
      {children}
    </button>
  );
}

export function DangerButton({ children, onClick, disabled = false }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="px-6 py-2 bg-slate-100 dark:bg-gray-800 text-red-600 dark:text-red-400 font-semibold rounded-lg border border-slate-300 dark:border-gray-700 hover:bg-red-50 dark:hover:bg-red-950 transition-colors disabled:bg-slate-50 dark:disabled:bg-gray-900 disabled:cursor-not-allowed"
    >
      {children}
    </button>
  );
}
