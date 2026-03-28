'use client';

import { AlertTriangle } from 'lucide-react';

export default function PendingApprovalsAlert({ count, show = true }) {
  if (!show || count === 0) {
    return null;
  }

  return (
    <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-400 dark:border-yellow-600 rounded-lg">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
            {count} Provider{count === 1 ? '' : 's'} Pending Approval
          </h3>
          <p className="mt-1 text-xs text-yellow-700 dark:text-yellow-400">
            Review and approve or reject provider applications on the Pending Approvals page.
          </p>
        </div>
      </div>
    </div>
  );
}
