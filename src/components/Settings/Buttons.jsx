'use client';

export function PrimaryButton({ children, onClick, disabled = false }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed"
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
      className="px-6 py-2 bg-slate-200 text-slate-800 font-semibold rounded-lg hover:bg-slate-300 transition-colors disabled:bg-slate-100 disabled:cursor-not-allowed"
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
      className="px-6 py-2 bg-slate-100 text-red-600 font-semibold rounded-lg border border-slate-300 hover:bg-red-50 transition-colors disabled:bg-slate-50 disabled:cursor-not-allowed"
    >
      {children}
    </button>
  );
}
