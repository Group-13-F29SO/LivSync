'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar/Navbar';
import SettingsSection from '@/components/Settings/SettingsSection';
import ToggleRow from '@/components/Settings/ToggleRow';
import { useAuth } from '@/hooks/useAuth';
import { useAccessibility } from '@/hooks/useAccessibility';
import { PrimaryButton, SecondaryButton, DangerButton } from '@/components/Settings/Buttons';

export default function SettingsPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const { accessibility, updateAccessibilitySetting } = useAccessibility();
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
  const [isLoadingPrivacy, setIsLoadingPrivacy] = useState(false);
  const [privacyError, setPrivacyError] = useState(null);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
    // Only allow patients to access this page
    if (!isLoading && user && user.userType === 'provider') {
      router.push('/provider');
    }
  }, [user, isLoading, router]);

  // Fetch current privacy consent status
  useEffect(() => {
    if (!isLoading && user && user.id && user.userType === 'patient') {
      fetchPrivacyConsent();
    }
  }, [user, isLoading]);

  const fetchPrivacyConsent = async () => {
    try {
      const response = await fetch(`/api/patient/privacy-consent?patientId=${user.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch privacy setting');
      }
      const data = await response.json();
      setSettings(prev => ({
        ...prev,
        privacy: {
          ...prev.privacy,
          shareData: data.shareDataWithProviders,
        },
      }));
    } catch (error) {
      console.error('Error fetching privacy consent:', error);
    }
  };

  const handleShareDataToggle = async (newValue) => {
    try {
      setIsLoadingPrivacy(true);
      setPrivacyError(null);

      const response = await fetch('/api/patient/privacy-consent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patientId: user.id,
          shareData: newValue,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update privacy setting');
      }

      const data = await response.json();
      setSettings(prev => ({
        ...prev,
        privacy: {
          ...prev.privacy,
          shareData: data.data.shareDataWithProviders,
        },
      }));
    } catch (error) {
      console.error('Error updating privacy consent:', error);
      setPrivacyError(error.message || 'Failed to update privacy setting');
    } finally {
      setIsLoadingPrivacy(false);
    }
  };

  const handleHealthAlertsToggle = (newValue) => {
    // If toggling OFF, show confirmation
    if (!newValue) {
      const confirmed = window.confirm(
        'Disabling this will stop you from receiving important health alerts about threshold breaches. Do you want to continue?'
      );
      if (!confirmed) {
        return; // User cancelled
      }
    }
    // Update the setting
    setSettings(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        healthAlerts: newValue,
      },
    }));
  };

  const handleHighContrastToggle = (newValue) => {
    updateAccessibilitySetting('highContrast', newValue);
  };

  const handleColorBlindToggle = (newValue) => {
    updateAccessibilitySetting('colorBlind', newValue);
  };



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

  const DevicesIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  );

  const ChevronRightIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );

  return (
    <div className="min-h-screen flex bg-white dark:bg-gray-950">
      {/* Navbar */}
      <Navbar />

      {/* Main Content */}
      <main className="flex-1 ml-20 overflow-auto bg-blue-50 dark:bg-gray-950 text-gray-900 dark:text-gray-50">
        <div className="p-8 max-w-4xl">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2 pb-1">
              Settings
            </h1>
            <p className="text-slate-500 dark:text-slate-400">Manage your account and app preferences</p>
          </div>

          {/* Profile Management Section */}
          <div className="mb-8">
            <SettingsSection
              icon={<UserIcon />}
              title="Profile"
            >
              <div className="space-y-4">
                <p className="text-slate-600 dark:text-slate-400">
                  Manage your personal information, including name, email, date of birth, and other profile details.
                </p>
                <button
                  onClick={() => router.push('/settings/profile')}
                  className="w-full flex items-center justify-between px-6 py-4 bg-slate-50 dark:bg-gray-800 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg border border-slate-200 dark:border-gray-700 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-blue-600 dark:text-blue-400">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <h4 className="font-semibold text-slate-800 dark:text-slate-100">Edit Profile</h4>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Update your personal information</p>
                    </div>
                  </div>
                  <div className="text-slate-400 dark:text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    <ChevronRightIcon />
                  </div>
                </button>
              </div>
            </SettingsSection>
          </div>

          {/* Connected Devices Section */}
          <div className="mb-8">
            <SettingsSection
              icon={<DevicesIcon />}
              title="Connected Devices"
            >
              <div className="space-y-4">
                <p className="text-slate-600 dark:text-slate-400">
                  Manage your wearable devices and health tracking equipment. Connect watches, fitness trackers, and other devices to sync your health data.
                </p>
                <button
                  onClick={() => router.push('/settings/devices')}
                  className="w-full flex items-center justify-between px-6 py-4 bg-slate-50 dark:bg-gray-800 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg border border-slate-200 dark:border-gray-700 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-blue-600 dark:text-blue-400">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <h4 className="font-semibold text-slate-800 dark:text-slate-100">Manage Devices</h4>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Add or remove connected devices</p>
                    </div>
                  </div>
                  <div className="text-slate-400 dark:text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    <ChevronRightIcon />
                  </div>
                </button>
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
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Current Password
                    </label>
                    <input
                      type="password"
                      placeholder="Enter current password"
                      className="w-full px-4 py-2 bg-slate-100 dark:bg-gray-800 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      New Password
                    </label>
                    <input
                      type="password"
                      placeholder="Enter new password"
                      className="w-full px-4 py-2 bg-slate-100 dark:bg-gray-800 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      placeholder="Confirm new password"
                      className="w-full px-4 py-2 bg-slate-100 dark:bg-gray-800 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                <div className="border-t border-slate-200 dark:border-gray-700 my-4"></div>

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
                  description="Receive alerts when your biomarker readings breach configured thresholds"
                  value={settings.notifications.healthAlerts}
                  onChange={handleHealthAlertsToggle}
                />
                <ToggleRow
                  label="Weekly Summary"
                  description="Get a summary of your weekly progress"
                  value={settings.notifications.weeklySummary}
                />
              </div>
            </SettingsSection>
          </div>

          {/* Alert Thresholds Section */}
          <div className="mb-8">
            <SettingsSection
              icon={<ShieldIcon />}
              title="Alert Thresholds"
            >
              <div className="space-y-4">
                <p className="text-slate-600 dark:text-slate-400">
                  Set custom alert thresholds for your biomarkers. You'll receive notifications when your readings fall outside these ranges.
                </p>
                <button
                  onClick={() => router.push('/settings/alert-thresholds')}
                  className="w-full flex items-center justify-between px-6 py-4 bg-slate-50 dark:bg-gray-800 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg border border-slate-200 dark:border-gray-700 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-blue-600 dark:text-blue-400">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <div className="text-left">
                      <h4 className="font-semibold text-slate-800 dark:text-slate-100">Configure Thresholds</h4>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Set alert ranges for your biomarkers</p>
                    </div>
                  </div>
                  <div className="text-slate-400 dark:text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    <ChevronRightIcon />
                  </div>
                </button>
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
                  value={accessibility.colorBlind}
                  onChange={handleColorBlindToggle}
                />
                <ToggleRow
                  label="High Contrast"
                  description="Use high contrast colors for better visibility"
                  value={accessibility.highContrast}
                  onChange={handleHighContrastToggle}
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
                  label="Share Data with Healthcare Providers"
                  description={settings.privacy.shareData ? "You can connect with healthcare providers" : "You cannot connect with healthcare providers"}
                  value={settings.privacy.shareData}
                  onChange={handleShareDataToggle}
                />
                {privacyError && (
                  <div className="text-red-600 dark:text-red-400 text-sm">
                    {privacyError}
                  </div>
                )}
                <ToggleRow
                  label="Anonymous Analytics"
                  description="Help us improve by sharing anonymous usage data"
                  value={settings.privacy.anonymousAnalytics}
                />

                {/* Divider */}
                <div className="border-t border-slate-200 dark:border-gray-700 my-6"></div>

                {/* Delete Account */}
                <div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-2">Danger Zone</h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
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
