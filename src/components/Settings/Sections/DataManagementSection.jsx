'use client';

import SettingsSection from '../SettingsSection';
import NavigationCard from '../NavigationCard';
import { UserIcon } from '../SectionIcons';

const DownloadIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);

export default function DataManagementSection() {
  return (
    <div className="mb-8">
      <SettingsSection
        icon={<DownloadIcon />}
        title="Data Management"
      >
        <div className="space-y-4">
          <p className="text-slate-600 dark:text-slate-400">
            Download or manage your personal data. You can export all your information including health metrics, profile data, and more.
          </p>
          <NavigationCard
            icon={<DownloadIcon />}
            title="Download My Data"
            description="Export your complete personal data in JSON format"
            href="/settings/data-download"
          />
        </div>
      </SettingsSection>
    </div>
  );
}
