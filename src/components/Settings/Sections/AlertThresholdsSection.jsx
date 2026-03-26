'use client';

import SettingsSection from '../SettingsSection';
import NavigationCard from '../NavigationCard';
import { AlertThresholdIcon } from '@/components/Icons/SettingsIcons';

export default function AlertThresholdsSection() {
  return (
    <div className="mb-8">
      <SettingsSection
        icon={<AlertThresholdIcon />}
        title="Alert Thresholds"
      >
        <div className="space-y-4">
          <p className="text-slate-600 dark:text-slate-400">
            Set custom alert thresholds for your biomarkers. You'll receive notifications when your readings fall outside these ranges.
          </p>
          <NavigationCard
            icon={<AlertThresholdIcon className="w-6 h-6" />}
            title="Configure Thresholds"
            description="Set alert ranges for your biomarkers"
            href="/settings/alert-thresholds"
          />
        </div>
      </SettingsSection>
    </div>
  );
}
