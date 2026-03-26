'use client';

import SettingsSection from '../SettingsSection';
import { SecondaryButton } from '../Buttons';
import { LockIcon } from '../SectionIcons';

export default function AccountSecuritySection({
  passwordForm,
  onPasswordFormChange,
  onChangePassword,
  isChangingPassword,
  passwordError,
  passwordSuccess,
  twoFactorEnabled,
  isLoadingTwoFactor,
  onToggleTwoFactor,
}) {
  return (
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
                value={passwordForm.currentPassword}
                onChange={(e) => onPasswordFormChange({ ...passwordForm, currentPassword: e.target.value })}
                disabled={isChangingPassword}
                className="w-full px-4 py-2 bg-slate-100 dark:bg-gray-800 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                New Password
              </label>
              <input
                type="password"
                placeholder="Enter new password"
                value={passwordForm.newPassword}
                onChange={(e) => onPasswordFormChange({ ...passwordForm, newPassword: e.target.value })}
                disabled={isChangingPassword}
                className="w-full px-4 py-2 bg-slate-100 dark:bg-gray-800 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Confirm New Password
              </label>
              <input
                type="password"
                placeholder="Confirm new password"
                value={passwordForm.confirmPassword}
                onChange={(e) => onPasswordFormChange({ ...passwordForm, confirmPassword: e.target.value })}
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
            <SecondaryButton onClick={onChangePassword} disabled={isChangingPassword}>
              {isChangingPassword ? 'Changing...' : 'Change Password'}
            </SecondaryButton>
          </div>

          {/* Divider */}
          <div className="border-t border-slate-200 dark:border-gray-700 my-4"></div>

          {/* Two-Factor Authentication */}
          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-gray-800 rounded-lg border border-slate-200 dark:border-gray-700">
            <div className="flex-1">
              <p className="font-medium text-slate-800 dark:text-slate-100">
                Two-Factor Authentication
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {twoFactorEnabled ? 'Enabled - Your account is protected' : 'Add an extra layer of security to your account'}
              </p>
            </div>
            <button
              onClick={() => onToggleTwoFactor(!twoFactorEnabled)}
              disabled={isLoadingTwoFactor}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                twoFactorEnabled
                  ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-800 disabled:opacity-50'
                  : 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800 disabled:opacity-50'
              }`}
            >
              {twoFactorEnabled ? 'Disable' : 'Enable'}
            </button>
          </div>
        </div>
      </SettingsSection>
    </div>
  );
}
