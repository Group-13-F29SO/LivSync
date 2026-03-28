'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useAccessibility } from '@/hooks/useAccessibility';
import TwoFactorModal from '@/components/Settings/TwoFactorModal';
import DeleteAccountModal from '@/components/Settings/DeleteAccountModal';
import DeleteAllDataModal from '@/components/Settings/DeleteAllDataModal';
import ProfileSection from '@/components/Settings/Sections/ProfileSection';
import DevicesSection from '@/components/Settings/Sections/DevicesSection';
import AccountSecuritySection from '@/components/Settings/Sections/AccountSecuritySection';
import NotificationsSection from '@/components/Settings/Sections/NotificationsSection';
import AlertThresholdsSection from '@/components/Settings/Sections/AlertThresholdsSection';
import AccessibilitySection from '@/components/Settings/Sections/AccessibilitySection';
import PrivacyConsentSection from '@/components/Settings/Sections/PrivacyConsentSection';
import DataManagementSection from '@/components/Settings/Sections/DataManagementSection';

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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteStep, setDeleteStep] = useState(1); // 1: credentials, 2: confirmation
  const [deleteCredentials, setDeleteCredentials] = useState({
    username: '',
    password: '',
  });
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);
  const [goalRemindersEnabled, setGoalRemindersEnabled] = useState(true);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState(null);
  const [passwordSuccess, setPasswordSuccess] = useState(null);
  const [showTwoFactorModal, setShowTwoFactorModal] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [twoFactorMode, setTwoFactorMode] = useState('enable'); // 'enable' or 'disable'
  const [isLoadingTwoFactor, setIsLoadingTwoFactor] = useState(false);
  const [showDeleteDataModal, setShowDeleteDataModal] = useState(false);
  const [isDeletingData, setIsDeletingData] = useState(false);
  const [deleteDataError, setDeleteDataError] = useState(null);
  const [deleteDataSuccess, setDeleteDataSuccess] = useState(null);

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
      loadGoalRemindersPreference();
      fetchTwoFactorStatus();
    }
  }, [user, isLoading]);

  const loadGoalRemindersPreference = () => {
    // Load from localStorage
    const savedPreference = localStorage.getItem('goalRemindersEnabled');
    if (savedPreference !== null) {
      setGoalRemindersEnabled(JSON.parse(savedPreference));
    }
  };

  const fetchTwoFactorStatus = async () => {
    try {
      const response = await fetch(`/api/patient/profile?patientId=${user.id}`);
      if (response.ok) {
        const data = await response.json();
        setTwoFactorEnabled(data.two_factor_enabled || false);
      }
    } catch (error) {
      console.error('Error fetching 2FA status:', error);
    }
  };

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

  const handleGoalRemindersToggle = async (newValue) => {
    try {
      // Update local state
      setGoalRemindersEnabled(newValue);
      
      // Save to localStorage
      localStorage.setItem('goalRemindersEnabled', JSON.stringify(newValue));

      // Update settings state
      setSettings(prev => ({
        ...prev,
        notifications: {
          ...prev.notifications,
          goalReminders: newValue,
        },
      }));

      // Call API to persist preference (optional)
      await fetch('/api/patient/goal-reminders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patientId: user.id,
          enabled: newValue,
        }),
      });
    } catch (error) {
      console.error('Error updating goal reminders setting:', error);
      // Revert the toggle if there's an error
      setGoalRemindersEnabled(!newValue);
    }
  };

  const handleHighContrastToggle = (newValue) => {
    updateAccessibilitySetting('highContrast', newValue);
  };

  const handleColorBlindToggle = (newValue) => {
    updateAccessibilitySetting('colorBlind', newValue);
  };

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
    setDeleteStep(1);
    setDeleteCredentials({ username: '', password: '' });
    setDeleteError(null);
  };

  const handleVerifyCredentials = async () => {
    if (!deleteCredentials.username || !deleteCredentials.password) {
      setDeleteError('Please enter both username and password');
      return;
    }

    try {
      setIsDeleting(true);
      setDeleteError(null);

      // Call endpoint with verifyOnly flag to just verify credentials
      const response = await fetch('/api/patient/delete-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patientId: user.id,
          username: deleteCredentials.username,
          password: deleteCredentials.password,
          verifyOnly: true,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setDeleteError(data.error || 'Invalid credentials. Please try again.');
        setIsDeleting(false);
        return;
      }

      // Credentials verified, show final confirmation
      setDeleteStep(2);
      setIsDeleting(false);
    } catch (error) {
      console.error('Error verifying credentials:', error);
      setDeleteError('Failed to verify credentials');
      setIsDeleting(false);
    }
  };

  const handleConfirmDelete = async () => {
    try {
      setIsDeleting(true);
      setDeleteError(null);

      // Actually delete the account
      const response = await fetch('/api/patient/delete-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patientId: user.id,
          username: deleteCredentials.username,
          password: deleteCredentials.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setDeleteError(data.error || 'Failed to delete account');
        setIsDeleting(false);
        return;
      }

      // Account deleted successfully, redirect to login
      setTimeout(() => {
        router.push('/login');
      }, 1500);
    } catch (error) {
      console.error('Error deleting account:', error);
      setDeleteError('Failed to delete account');
      setIsDeleting(false);
    }
  };

  const handleCloseDeleteModal = () => {
    if (!isDeleting) {
      setShowDeleteModal(false);
      setDeleteStep(1);
      setDeleteCredentials({ username: '', password: '' });
      setDeleteError(null);
    }
  };

  const handleChangePassword = async () => {
    setPasswordError(null);
    setPasswordSuccess(null);

    // Validation
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordError('Please fill in all password fields');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long');
      return;
    }

    if (passwordForm.newPassword === passwordForm.currentPassword) {
      setPasswordError('New password must be different from current password');
      return;
    }

    try {
      setIsChangingPassword(true);
      const response = await fetch('/api/patient/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patientId: user.id,
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setPasswordError(data.error || 'Failed to change password');
        return;
      }

      setPasswordSuccess('Password changed successfully! You can now log in with your new password.');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });

      // Clear success message after 5 seconds
      setTimeout(() => {
        setPasswordSuccess(null);
      }, 5000);
    } catch (error) {
      console.error('Error changing password:', error);
      setPasswordError('An error occurred while changing your password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleTwoFactorToggle = (enabled) => {
    if (enabled) {
      // Enable 2FA
      setTwoFactorMode('enable');
    } else {
      // Disable 2FA
      setTwoFactorMode('disable');
    }
    setShowTwoFactorModal(true);
  };

  const handleTwoFactorSuccess = () => {
    setTwoFactorEnabled(!twoFactorEnabled);
  };

  const handleAnonymousAnalyticsToggle = (newValue) => {
    setSettings(prev => ({
      ...prev,
      privacy: {
        ...prev.privacy,
        anonymousAnalytics: newValue,
      },
    }));
  };

  const handlePasswordFormChange = (newForm) => {
    setPasswordForm(newForm);
  };

  const handleDeleteDataClick = () => {
    setShowDeleteDataModal(true);
    setDeleteDataError(null);
  };

  const handleCloseDeleteDataModal = () => {
    if (!isDeletingData) {
      setShowDeleteDataModal(false);
      setDeleteDataError(null);
      setDeleteDataSuccess(null);
    }
  };

  const handleConfirmDeleteData = async () => {
    try {
      setIsDeletingData(true);
      setDeleteDataError(null);
      setDeleteDataSuccess(null);

      const response = await fetch('/api/patient/delete-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          patientId: user.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setDeleteDataError(data.error || 'Failed to delete data');
        setIsDeletingData(false);
        return;
      }

      setDeleteDataSuccess('All data has been successfully deleted. Your account remains active.');
      
      // Close modal after success message
      setTimeout(() => {
        setShowDeleteDataModal(false);
        setDeleteDataSuccess(null);
        // Optionally refresh the page or navigate
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error('Error deleting data:', error);
      setDeleteDataError('An error occurred while deleting your data. Please try again.');
      setIsDeletingData(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white dark:bg-gray-950">
      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-blue-50 dark:bg-gray-950 text-gray-900 dark:text-gray-50 pb-32">
        <div className="p-8 max-w-4xl">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2 pb-1">
              Settings
            </h1>
            <p className="text-slate-500 dark:text-slate-400">Manage your account and app preferences</p>
          </div>

          {/* Sections */}
          <ProfileSection />
          <DataManagementSection />
          <DevicesSection />
          <AccountSecuritySection
            passwordForm={passwordForm}
            onPasswordFormChange={handlePasswordFormChange}
            onChangePassword={handleChangePassword}
            isChangingPassword={isChangingPassword}
            passwordError={passwordError}
            passwordSuccess={passwordSuccess}
            twoFactorEnabled={twoFactorEnabled}
            isLoadingTwoFactor={isLoadingTwoFactor}
            onToggleTwoFactor={handleTwoFactorToggle}
          />
          <NotificationsSection
            goalRemindersEnabled={goalRemindersEnabled}
            onGoalRemindersToggle={handleGoalRemindersToggle}
            healthAlertsEnabled={settings.notifications.healthAlerts}
            onHealthAlertsToggle={handleHealthAlertsToggle}
            weeklySummaryEnabled={settings.notifications.weeklySummary}
          />
          <AlertThresholdsSection />
          <AccessibilitySection
            colorBlindEnabled={accessibility.colorBlind}
            onColorBlindToggle={handleColorBlindToggle}
            highContrastEnabled={accessibility.highContrast}
            onHighContrastToggle={handleHighContrastToggle}
          />
          <PrivacyConsentSection
            shareDataEnabled={settings.privacy.shareData}
            onShareDataToggle={handleShareDataToggle}
            anonymousAnalyticsEnabled={settings.privacy.anonymousAnalytics}
            onAnonymousAnalyticsToggle={handleAnonymousAnalyticsToggle}
            privacyError={privacyError}
            onDeleteClick={handleDeleteClick}
            onDeleteDataClick={handleDeleteDataClick}
          />
        </div>
      </main>

      {/* Two-Factor Modal */}
      <TwoFactorModal
        userId={user?.id}
        isOpen={showTwoFactorModal}
        onClose={() => setShowTwoFactorModal(false)}
        onSuccess={handleTwoFactorSuccess}
        mode={twoFactorMode}
      />

      {/* Delete Account Modal */}
      <DeleteAccountModal
        isOpen={showDeleteModal}
        deleteStep={deleteStep}
        deleteCredentials={deleteCredentials}
        onCredentialsChange={setDeleteCredentials}
        isDeleting={isDeleting}
        deleteError={deleteError}
        onVerifyCredentials={handleVerifyCredentials}
        onConfirmDelete={handleConfirmDelete}
        onClose={handleCloseDeleteModal}
      />

      {/* Delete All Data Modal */}
      <DeleteAllDataModal
        isOpen={showDeleteDataModal}
        isDeleting={isDeletingData}
        deleteError={deleteDataError}
        onConfirm={handleConfirmDeleteData}
        onClose={handleCloseDeleteDataModal}
      />
    </div>
  );
}
