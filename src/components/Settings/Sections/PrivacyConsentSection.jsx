'use client';

import SettingsSection from '../SettingsSection';
import ToggleRow from '../ToggleRow';
import { DangerButton } from '../Buttons';
import { PrivacyIcon as PrivacyIconComponent } from '@/components/Icons/SettingsIcons';

export default function PrivacyConsentSection({
  shareDataEnabled,
  onShareDataToggle,
  anonymousAnalyticsEnabled,
  onAnonymousAnalyticsToggle,
  privacyError,
  onDeleteClick,
  onDeleteDataClick,
}) {
  return (
    <div className="mb-8">
      <SettingsSection
        icon={<PrivacyIconComponent />}
        title="Privacy & Consent"
      >
        <div className="space-y-4">
          <ToggleRow
            label="Share Data with Healthcare Providers"
            description={shareDataEnabled ? "You can connect with healthcare providers" : "You cannot connect with healthcare providers"}
            value={shareDataEnabled}
            onChange={onShareDataToggle}
          />
          {privacyError && (
            <div className="text-red-600 dark:text-red-400 text-sm">
              {privacyError}
            </div>
          )}
          <ToggleRow
            label="Anonymous Analytics"
            description="Help us improve by sharing anonymous usage data"
            value={anonymousAnalyticsEnabled}
            onChange={onAnonymousAnalyticsToggle}
          />

          {/* Divider */}
          <div className="border-t border-slate-200 dark:border-gray-700 my-6"></div>

          {/* Danger Zone */}
          <div>
            <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-4">Danger Zone</h4>
            <div className="space-y-3">
              {/* Delete All Data Button */}
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                  Delete all your health data (but keep your account)
                </p>
                <DangerButton onClick={onDeleteDataClick}>
                  Delete All My Data
                </DangerButton>
              </div>

              {/* Delete Account Button */}
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                  Permanently delete your account and all associated data
                </p>
                <DangerButton onClick={onDeleteClick}>
                  Delete Account
                </DangerButton>
              </div>
            </div>
          </div>
        </div>
      </SettingsSection>
    </div>
  );
}
