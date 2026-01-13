'use client';

export default function ToggleRow({ label, description, value, onChange }) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-slate-100 last:border-b-0">
      <div className="flex-1">
        <h4 className="font-bold text-slate-800">{label}</h4>
        {description && (
          <p className="text-sm text-slate-500 mt-1">{description}</p>
        )}
      </div>
      
      {/* Toggle Switch */}
      <button
        onClick={() => onChange(!value)}
        className={`ml-4 flex-shrink-0 relative inline-flex items-center h-6 w-11 rounded-full transition-colors ${
          value ? 'bg-blue-600' : 'bg-slate-300'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            value ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}
