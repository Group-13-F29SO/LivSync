'use client';

export default function EmptyDevicesState() {
  return (
    <div className="text-center py-12">
      <div className="text-slate-400 dark:text-slate-500 mb-4">
        <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">
        No Devices Connected
      </h3>
      <p className="text-slate-500 dark:text-slate-400 mb-6">
        Connect a wearable device to start tracking your health data
      </p>
    </div>
  );
}
