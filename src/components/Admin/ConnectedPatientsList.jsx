'use client';

import { useRouter } from 'next/navigation';
import { Users, CheckCircle2, Clock } from 'lucide-react';

export default function ConnectedPatientsList({ patients, patientCount, title = 'Connected Patients' }) {
  const router = useRouter();

  if (!patients || patients.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-900/50 rounded-lg shadow-sm p-12 text-center border border-gray-100 dark:border-gray-800/50">
        <Users className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
        <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">No Connected Patients</h3>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          No patients connected to this provider yet.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900/50 rounded-lg shadow-sm p-6 border border-gray-100 dark:border-gray-800/50">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
        <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        {title} ({patientCount})
      </h2>
      <div className="space-y-2">
        {patients.map((patient) => (
          <div
            key={patient.id}
            className="p-4 bg-gray-50/50 dark:bg-gray-800/30 rounded-lg hover:bg-gray-100/50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer border border-gray-100 dark:border-gray-700/50"
            onClick={() => router.push(`/admin/patients/${patient.id}`)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {patient.firstName} {patient.lastName}
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  @{patient.username} • {patient.email}
                </p>
                <div className="flex items-center gap-3 mt-2">
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${
                    patient.providerConsentStatus === 'accepted' || patient.providerConsentStatus === true
                      ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300'
                      : 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
                  }`}>
                    {patient.providerConsentStatus === 'accepted' || patient.providerConsentStatus === true ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Approved
                      </>
                    ) : (
                      <>
                        <Clock className="w-3.5 h-3.5" />
                        Pending
                      </>
                    )}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Joined {new Date(patient.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
