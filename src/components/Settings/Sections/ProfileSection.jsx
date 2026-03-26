'use client';

import SettingsSection from '../SettingsSection';
import NavigationCard from '../NavigationCard';
import { UserIcon, InfoIcon } from '../SectionIcons';

export default function ProfileSection() {
  return (
    <div className="mb-8">
      <SettingsSection
        icon={<UserIcon />}
        title="Profile"
      >
        <div className="space-y-4">
          <p className="text-slate-600 dark:text-slate-400">
            Manage your personal information, including name, email, date of birth, and other profile details.
          </p>
          <NavigationCard
            icon={<InfoIcon />}
            title="Edit Profile"
            description="Update your personal information"
            href="/settings/profile"
          />
        </div>
      </SettingsSection>
    </div>
  );
}
