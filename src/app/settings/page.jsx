'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar/Navbar';
import SettingsSection from '@/components/Settings/SettingsSection';
import ToggleRow from '@/components/Settings/ToggleRow';
import { PrimaryButton, SecondaryButton, DangerButton } from '@/components/Settings/Buttons';

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    notifications: {
      goalReminders: true,
      healthAlerts: true,
      weeklySummary: true,
    },
    accessibility: {
      colorBlind: false,
      largeText: false,
      highContrast: false,
    },
    privacy: {
      shareData: false,
      anonymousAnalytics: true,
    },
    twoFactor: false,
  });



  // Icons
  const UserIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );

  const LockIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  );

  const BellIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  );

  const EyeIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );

  const ShieldIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m7.784-4.817a.75.75 0 00-1.069 0l-15.5 15.5a.75.75 0 1001.069 1.069l15.5-15.5a.75.75 0 000-1.069z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
    </svg>
  );

  return (
    <div className="min-h-screen flex bg-blue-50">
      {/* Navbar */}
      <Navbar />

      {/* Main Content */}
      <main className="flex-1 ml-24 overflow-auto">
        <div className="p-8 max-w-4xl">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2 pb-1">
              Settings
            </h1>
            <p className="text-slate-500">Manage your account and app preferences</p>
          </div>

          {/* Profile Management Section */}
          <div className="mb-8">
            <SettingsSection
              icon={<UserIcon />}
              title="Profile Management"
            >
              <div className="space-y-6">
                {/* First Name and Last Name */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      First Name
                    </label>
                    <input
                      type="text"
                      placeholder="Enter your first name"
                      className="w-full px-4 py-2 bg-slate-100 rounded-lg text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Last Name
                    </label>
                    <input
                      type="text"
                      placeholder="Enter your last name"
                      className="w-full px-4 py-2 bg-slate-100 rounded-lg text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    placeholder="Enter your email address"
                    className="w-full px-4 py-2 bg-slate-100 rounded-lg text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Save Button */}
                <div className="pt-4">
                  <PrimaryButton>
                    Save Changes
                  </PrimaryButton>
                </div>
              </div>
            </SettingsSection>
          </div>

          {/* Account & Security Section */}
          <div className="mb-8">
            <SettingsSection
              icon={<LockIcon />}
              title="Account & Security"
            >
              <div className="space-y-6">
                {/* Password Fields */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Current Password
                    </label>
                    <input
                      type="password"
                      placeholder="Enter current password"
                      className="w-full px-4 py-2 bg-slate-100 rounded-lg text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      New Password
                    </label>
                    <input
                      type="password"
                      placeholder="Enter new password"
                      className="w-full px-4 py-2 bg-slate-100 rounded-lg text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      placeholder="Confirm new password"
                      className="w-full px-4 py-2 bg-slate-100 rounded-lg text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Change Password Button */}
                <div className="flex gap-3 pt-4">
                  <SecondaryButton>
                    Change Password
                  </SecondaryButton>
                </div>

                {/* Divider */}
                <div className="border-t border-slate-200 my-4"></div>

                {/* Two-Factor Authentication */}
                <ToggleRow
                  label="Two-Factor Authentication"
                  description="Add an extra layer of security to your account"
                  value={settings.twoFactor}
                />
              </div>
            </SettingsSection>
          </div>

          {/* Notifications Section */}
          <div className="mb-8">
            <SettingsSection
              icon={<BellIcon />}
              title="Notifications"
            >
              <div className="space-y-2">
                <ToggleRow
                  label="Goal Reminders"
                  description="Get reminded about your upcoming goals"
                  value={settings.notifications.goalReminders}
                />
                <ToggleRow
                  label="Health Alerts"
                  description="Receive alerts for important health milestones"
                  value={settings.notifications.healthAlerts}
                />
                <ToggleRow
                  label="Weekly Summary"
                  description="Get a summary of your weekly progress"
                  value={settings.notifications.weeklySummary}
                />
              </div>
            </SettingsSection>
          </div>

          {/* Accessibility Section */}
          <div className="mb-8">
            <SettingsSection
              icon={<EyeIcon />}
              title="Accessibility"
            >
              <div className="space-y-2">
                <ToggleRow
                  label="Color-blind Friendly Mode"
                  description="Use a color palette optimized for color blindness"
                  value={settings.accessibility.colorBlind}
                />
                <ToggleRow
                  label="Large Text"
                  description="Increase text size throughout the app"
                  value={settings.accessibility.largeText}
                />
                <ToggleRow
                  label="High Contrast"
                  description="Use high contrast colors for better visibility"
                  value={settings.accessibility.highContrast}
                />
              </div>
            </SettingsSection>
          </div>

          {/* Privacy & Consent Section */}
          <div className="mb-8">
            <SettingsSection
              icon={<ShieldIcon />}
              title="Privacy & Consent"
            >
              <div className="space-y-4">
                <ToggleRow
                  label="Share Data with Partners"
                  description="Allow us to share your data with trusted partners"
                  value={settings.privacy.shareData}
                />
                <ToggleRow
                  label="Anonymous Analytics"
                  description="Help us improve by sharing anonymous usage data"
                  value={settings.privacy.anonymousAnalytics}
                />

                {/* Divider */}
                <div className="border-t border-slate-200 my-6"></div>

                {/* Delete Account */}
                <div>
                  <h4 className="font-bold text-slate-800 mb-2">Danger Zone</h4>
                  <p className="text-sm text-slate-500 mb-4">
                    Permanently delete your account and all associated data
                  </p>
                  <DangerButton>
                    Delete Account
                  </DangerButton>
                </div>
              </div>
            </SettingsSection>
          </div>
        </div>
      </main>
    </div>
  );
}
