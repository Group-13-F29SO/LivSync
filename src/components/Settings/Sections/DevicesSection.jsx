'use client';

import SettingsSection from '../SettingsSection';
import NavigationCard from '../NavigationCard';
import { DevicesIconSvg } from '@/components/Icons/SettingsIcons';

export default function DevicesSection() {
  return (
    <div className="mb-8">
      <SettingsSection
        icon={<DevicesIconSvg />}
        title="Connected Devices"
      >
        <div className="space-y-4">
          <p className="text-slate-600 dark:text-slate-400">
            Manage your wearable devices and health tracking equipment. Connect watches, fitness trackers, and other devices to sync your health data.
          </p>
          <NavigationCard
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            title="Manage Devices"
            description="Add or remove connected devices"
            href="/settings/devices"
          />
        </div>
      </SettingsSection>
    </div>
  );
}
