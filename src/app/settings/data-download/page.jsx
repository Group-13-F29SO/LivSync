'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import DownloadDataButton from '@/components/Settings/DownloadDataButton';

export default function DataDownloadPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
    if (!isLoading && user && user.userType === 'provider') {
      router.push('/provider');
    }
  }, [user, isLoading, router]);

  const BackIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex bg-white dark:bg-gray-950">
        <main className="flex-1 overflow-auto bg-blue-50 dark:bg-gray-950 flex items-center justify-center">
          <div className="animate-pulse text-gray-500 dark:text-gray-400">Loading...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-white dark:bg-gray-950">
      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-blue-50 dark:bg-gray-950 text-gray-900 dark:text-gray-50">
        <div className="p-8 max-w-4xl">
          {/* Page Header with Back Button */}
          <div className="mb-8">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mb-4 transition-colors"
            >
              <BackIcon />
              <span className="font-medium">Back to Settings</span>
            </button>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2 pb-1">
              Download Your Data
            </h1>
            <p className="text-slate-500 dark:text-slate-400">
              Download a complete copy of all your personal data from LivSync in JSON format
            </p>
          </div>

          {/* Information Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="p-4 bg-white dark:bg-gray-900 rounded-lg border border-slate-200 dark:border-gray-800">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100">Complete Data</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">All your personal information and metrics</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-white dark:bg-gray-900 rounded-lg border border-slate-200 dark:border-gray-800">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                  <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100">Secure Download</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Your data is encrypted and secure</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-white dark:bg-gray-900 rounded-lg border border-slate-200 dark:border-gray-800">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                  <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3v-6" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100">JSON Format</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Standard format for easy import elsewhere</p>
                </div>
              </div>
            </div>
          </div>

          {/* Download Section */}
          <div className="mb-8">
            <DownloadDataButton patientId={user?.id} username={user?.username} />
          </div>

          {/* FAQ Section */}
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-slate-200 dark:border-gray-800 p-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Frequently Asked Questions</h2>

            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-slate-800 dark:text-slate-200 mb-2">What data is included?</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Your download includes your profile information, biometric data, goals, devices, achievements, notifications, alert thresholds, critical events, and provider connection information.
                </p>
              </div>

              <div>
                <h3 className="font-medium text-slate-800 dark:text-slate-200 mb-2">How long does it take?</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Data compilation is typically immediate for most users. Larger datasets may take a few seconds to prepare and download.
                </p>
              </div>

              <div>
                <h3 className="font-medium text-slate-800 dark:text-slate-200 mb-2">Is my data secure?</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Yes. Your data is only accessible by you through your account, and the download connection is encrypted. The file is created on-demand and not stored on our servers.
                </p>
              </div>

              <div>
                <h3 className="font-medium text-slate-800 dark:text-slate-200 mb-2">Can I download my data multiple times?</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Yes. You can download your data as many times as you need. Each download will contain your current data.
                </p>
              </div>

              <div>
                <h3 className="font-medium text-slate-800 dark:text-slate-200 mb-2">What format is the file?</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Your data is exported in JSON (JavaScript Object Notation) format, which is a standard, human-readable format that can be imported into other applications or analyzed with various tools.
                </p>
              </div>

              <div>
                <h3 className="font-medium text-slate-800 dark:text-slate-200 mb-2">Can I use this data elsewhere?</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Yes. You can use your exported data with other health applications or for personal analysis. The JSON format is widely supported.
                </p>
              </div>
            </div>
          </div>

          {/* Privacy Notice */}
          <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm text-blue-800 dark:text-blue-200">
            <p>
              <strong>Privacy Notice:</strong> This feature is provided to help you exercise your data rights. Your data download is secure and only accessible by you. We never share or sell your personal data.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
