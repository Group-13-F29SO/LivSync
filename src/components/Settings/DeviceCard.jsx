'use client';

import { SecondaryButton, DangerButton } from './Buttons';

export default function DeviceCard({ device, onSync, onRemove }) {
  const WatchIcon = () => (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );

  const BatteryIcon = ({ percentage }) => {
    let fillColor = 'text-green-500';
    if (percentage < 20) fillColor = 'text-red-500';
    else if (percentage < 50) fillColor = 'text-yellow-500';

    return (
      <div className="flex items-center gap-2">
        <svg className={`w-6 h-6 ${fillColor}`} fill="currentColor" viewBox="0 0 24 24">
          <path d="M15.67 4H14V2h-4v2H8.33C7.6 4 7 4.6 7 5.33v15.33C7 21.4 7.6 22 8.33 22h7.33c.74 0 1.34-.6 1.34-1.33V5.33C17 4.6 16.4 4 15.67 4z" />
        </svg>
        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{percentage}%</span>
      </div>
    );
  };

  return (
    <div className="bg-slate-50 dark:bg-gray-800 rounded-xl p-4 border border-slate-200 dark:border-gray-700">
      <div className="flex items-start justify-between">
        {/* Device Info */}
        <div className="flex items-start gap-4">
          <div className="text-blue-600 dark:text-blue-400 mt-1">
            <WatchIcon />
          </div>
          <div className="flex-1">
            <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-1">
              {device.name}
            </h4>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-1.5"></span>
                  {device.status}
                </span>
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  Last synced: {device.lastSync}
                </span>
              </div>
              <div className="mt-2">
                <BatteryIcon percentage={device.battery} />
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <SecondaryButton onClick={onSync}>
            Sync Now
          </SecondaryButton>
          <DangerButton onClick={onRemove}>
            Remove
          </DangerButton>
        </div>
      </div>
    </div>
  );
}
