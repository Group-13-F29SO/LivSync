'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import ProviderDeleteAccountModal from '@/components/Settings/ProviderDeleteAccountModal';
import PasswordInput from '@/components/PasswordInput';
import { SecondaryButton, PrimaryButton } from '@/components/Settings/Buttons';

export default function ProviderSettingsPage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState(null);
  const [passwordSuccess, setPasswordSuccess] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteStep, setDeleteStep] = useState(1);
  const [deleteCredentials, setDeleteCredentials] = useState({
    username: '',
    password: '',
  });
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
    // Only allow providers to access this page
    if (!isLoading && user && user.userType !== 'provider') {
      router.push('/dashboard');
    }
  }, [user, isLoading, router]);

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
      const response = await fetch('/api/provider/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          providerId: user.id,
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

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
    setDeleteStep(1);
    setDeleteCredentials({ username: '', password: '' });
    setDeleteError(null);
  };

  const handleVerifyCredentials = async () => {
    if (!deleteCredentials.username || !deleteCredentials.password) {
      setDeleteError('Please enter both email and password');
      return;
    }

    try {
      setIsDeleting(true);
      setDeleteError(null);

      const response = await fetch('/api/provider/delete-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          providerId: user.id,
          email: deleteCredentials.username,
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

      const response = await fetch('/api/provider/delete-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          providerId: user.id,
          email: deleteCredentials.username,
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

  const handlePasswordFormChange = (newForm) => {
    setPasswordForm(newForm);
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950">
        <p className="text-gray-600 dark:text-gray-400">Loading...</p>
      </div>
    );
  }

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
            <p className="text-slate-500 dark:text-slate-400">Manage your account settings</p>
          </div>

          {/* Profile Section */}
          <div className="mb-8 bg-white dark:bg-gray-900 rounded-2xl shadow-sm dark:shadow-lg border border-slate-200 dark:border-gray-800 overflow-hidden">
            <div className="px-6 py-4">
              <div className="flex items-center gap-4 pb-4">
                <div className="text-blue-600 dark:text-blue-400">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Profile</h3>
              </div>
              <div className="border-t border-slate-200 dark:border-gray-800"></div>
            </div>

            <div className="px-6 py-6">
              <div className="space-y-4">
                <p className="text-slate-600 dark:text-slate-400">
                  Manage your personal information, including name, email, and specialty.
                </p>
                <a
                  href="/provider/settings/profile"
                  className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Edit Profile
                </a>
              </div>
            </div>
          </div>

          {/* Account & Security Section */}
          <div className="mb-8 bg-white dark:bg-gray-900 rounded-2xl shadow-sm dark:shadow-lg border border-slate-200 dark:border-gray-800 overflow-hidden">
            <div className="px-6 py-4">
              <div className="flex items-center gap-4 pb-4">
                <div className="text-blue-600 dark:text-blue-400">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Account & Security</h3>
              </div>
              <div className="border-t border-slate-200 dark:border-gray-800"></div>
            </div>

            <div className="px-6 py-6">
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
                      value={passwordForm.currentPassword}
                      onChange={(e) => handlePasswordFormChange({ ...passwordForm, currentPassword: e.target.value })}
                      disabled={isChangingPassword}
                      className="w-full px-4 py-2 bg-slate-100 dark:bg-gray-800 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    />
                  </div>

                  <PasswordInput
                    value={passwordForm.newPassword}
                    onChange={(e) => handlePasswordFormChange({ ...passwordForm, newPassword: e.target.value })}
                    label="New Password"
                    placeholder="Enter new password"
                    disabled={isChangingPassword}
                    showValidation={passwordForm.newPassword.length > 0}
                    className="bg-slate-100 dark:bg-gray-800 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400"
                  />

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      placeholder="Confirm new password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => handlePasswordFormChange({ ...passwordForm, confirmPassword: e.target.value })}
                      disabled={isChangingPassword}
                      className="w-full px-4 py-2 bg-slate-100 dark:bg-gray-800 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    />
                  </div>
                </div>

                {/* Error Message */}
                {passwordError && (
                  <div className="text-red-600 dark:text-red-400 text-sm p-3 bg-red-50 dark:bg-red-950 rounded-lg">
                    {passwordError}
                  </div>
                )}

                {/* Success Message */}
                {passwordSuccess && (
                  <div className="text-green-600 dark:text-green-400 text-sm p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                    {passwordSuccess}
                  </div>
                )}

                {/* Change Password Button */}
                <div className="flex gap-3 pt-4">
                  <SecondaryButton onClick={handleChangePassword} disabled={isChangingPassword}>
                    {isChangingPassword ? 'Changing...' : 'Change Password'}
                  </SecondaryButton>
                </div>
              </div>
            </div>
          </div>

          {/* Delete Account Section */}
          <div className="mb-8 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4">
              <div className="flex items-center gap-4 pb-4">
                <div className="text-red-600 dark:text-red-400">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-red-700 dark:text-red-300">Danger Zone</h3>
              </div>
              <div className="border-t border-red-200 dark:border-red-800"></div>
            </div>

            <div className="px-6 py-6">
              <div className="space-y-4">
                <p className="text-red-700 dark:text-red-300 text-sm">
                  Deleting your account is permanent and cannot be undone. All your data including appointments, prescriptions, and patient connections will be deleted.
                </p>
                <button
                  onClick={handleDeleteClick}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Delete Account Modal */}
      <ProviderDeleteAccountModal
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
    </div>
  );
}
