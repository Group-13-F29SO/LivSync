'use client';

import { useState } from 'react';
import { forgotPassword, verifyResetToken, resetPassword } from '@/services/authService';

export default function ForgotPasswordForm({ userType = 'patient', onBack, onSuccess }) {
  const [step, setStep] = useState(1); // 1: email, 2: verification, 3: new password
  const [formData, setFormData] = useState({
    email: '',
    resetCode: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [passwordErrors, setPasswordErrors] = useState([]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
    if (field === 'newPassword' || field === 'confirmPassword') {
      setPasswordErrors([]);
    }
  };

  const handleRequestReset = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await forgotPassword(formData.email, userType);
      setStep(2);
    } catch (err) {
      setError(err.message || 'Failed to send reset email');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (formData.resetCode.length !== 6 || isNaN(formData.resetCode)) {
      setError('Please enter a valid 6-digit code');
      setIsLoading(false);
      return;
    }

    try {
      await verifyResetToken(formData.email, formData.resetCode, userType);
      setStep(3);
    } catch (err) {
      setError(err.message || 'Invalid or expired code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setPasswordErrors([]);

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    // Validate password complexity
    const errors = [];
    if (formData.newPassword.length < 8) errors.push('Password must be at least 8 characters');
    if (!/[A-Z]/.test(formData.newPassword)) errors.push('Must contain an uppercase letter');
    if (!/[a-z]/.test(formData.newPassword)) errors.push('Must contain a lowercase letter');
    if (!/\d/.test(formData.newPassword)) errors.push('Must contain a number');
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(formData.newPassword)) errors.push('Must contain a special character');

    if (errors.length > 0) {
      setPasswordErrors(errors);
      setIsLoading(false);
      return;
    }

    try {
      await resetPassword(formData.email, formData.resetCode, formData.newPassword, formData.confirmPassword, userType);
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setError(err.message || 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 via-purple-500 to-pink-600 bg-clip-text text-transparent text-center" style={{paddingBottom: '8px'}}>
        Reset Your Password
      </h1>
      <p className="text-center text-gray-100 dark:text-gray-300 mb-8 text-sm">
        {step === 1 && 'Enter your email to receive a password reset code'}
        {step === 2 && 'Enter the 6-digit code sent to your email'}
        {step === 3 && 'Create a new password for your account'}
      </p>

      {error && (
        <div className="mb-6 p-4 bg-red-500 bg-opacity-20 border border-red-500 rounded-lg">
          <p className="text-red-200 text-sm">{error}</p>
        </div>
      )}

      {passwordErrors.length > 0 && (
        <div className="mb-6 p-4 bg-yellow-500 bg-opacity-20 border border-yellow-500 rounded-lg">
          <p className="text-yellow-200 text-sm font-semibold mb-2">Password requirements:</p>
          <ul className="text-yellow-200 text-sm space-y-1">
            {passwordErrors.map((err, idx) => (
              <li key={idx}>• {err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Step 1: Email */}
      {step === 1 && (
        <form onSubmit={handleRequestReset} className="space-y-6">
          <div>
            <label className="block text-gray-100 dark:text-gray-200 text-sm font-medium mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="Enter your email address"
              disabled={isLoading}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-purple-500 dark:focus:border-purple-400 transition-colors disabled:opacity-50"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !formData.email}
            className="w-full bg-gradient-to-br from-blue-600 via-purple-500 to-pink-600 text-white font-semibold py-2 rounded-lg hover:shadow-lg transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Sending...' : 'Send Reset Code'}
          </button>

          <button
            type="button"
            onClick={onBack}
            disabled={isLoading}
            className="w-full bg-gray-600 dark:bg-gray-700 text-white font-semibold py-2 rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
          >
            Back to Login
          </button>
        </form>
      )}

      {/* Step 2: Verification Code */}
      {step === 2 && (
        <form onSubmit={handleVerifyCode} className="space-y-6">
          <div>
            <label className="block text-gray-100 dark:text-gray-200 text-sm font-medium mb-2">
              Verification Code
            </label>
            <p className="text-gray-300 dark:text-gray-400 text-xs mb-3">
              Code sent to: <span className="font-semibold">{formData.email}</span>
            </p>
            <input
              type="text"
              value={formData.resetCode}
              onChange={(e) => {
                const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
                handleChange('resetCode', value);
              }}
              placeholder="000000"
              maxLength="6"
              disabled={isLoading}
              autoFocus
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-purple-500 dark:focus:border-purple-400 transition-colors disabled:opacity-50 text-center text-2xl tracking-widest font-mono"
              required
            />
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
              (Code expires in 30 minutes)
            </p>
          </div>

          <button
            type="submit"
            disabled={isLoading || formData.resetCode.length !== 6}
            className="w-full bg-gradient-to-br from-blue-600 via-purple-500 to-pink-600 text-white font-semibold py-2 rounded-lg hover:shadow-lg transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Verifying...' : 'Verify Code'}
          </button>

          <button
            type="button"
            onClick={() => setStep(1)}
            disabled={isLoading}
            className="w-full bg-gray-600 dark:bg-gray-700 text-white font-semibold py-2 rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
          >
            Back
          </button>
        </form>
      )}

      {/* Step 3: New Password */}
      {step === 3 && (
        <form onSubmit={handleResetPassword} className="space-y-6">
          <div>
            <label className="block text-gray-100 dark:text-gray-200 text-sm font-medium mb-2">
              New Password
            </label>
            <input
              type="password"
              value={formData.newPassword}
              onChange={(e) => handleChange('newPassword', e.target.value)}
              placeholder="Enter new password"
              disabled={isLoading}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-purple-500 dark:focus:border-purple-400 transition-colors disabled:opacity-50"
              required
            />
          </div>

          <div>
            <label className="block text-gray-100 dark:text-gray-200 text-sm font-medium mb-2">
              Confirm Password
            </label>
            <input
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => handleChange('confirmPassword', e.target.value)}
              placeholder="Confirm new password"
              disabled={isLoading}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-purple-500 dark:focus:border-purple-400 transition-colors disabled:opacity-50"
              required
            />
          </div>

          <div className="p-3 bg-blue-500 bg-opacity-10 border border-blue-500 rounded-lg">
            <p className="text-blue-200 text-xs font-semibold mb-2">Password requirements:</p>
            <ul className="text-blue-200 text-xs space-y-1">
              <li>✓ At least 8 characters</li>
              <li>✓ One uppercase letter</li>
              <li>✓ One lowercase letter</li>
              <li>✓ One number</li>
              <li>✓ One special character (!@#$%^&*)</li>
            </ul>
          </div>

          <button
            type="submit"
            disabled={isLoading || !formData.newPassword || !formData.confirmPassword}
            className="w-full bg-gradient-to-br from-blue-600 via-purple-500 to-pink-600 text-white font-semibold py-2 rounded-lg hover:shadow-lg transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Resetting...' : 'Reset Password'}
          </button>

          <button
            type="button"
            onClick={onBack}
            disabled={isLoading}
            className="w-full bg-gray-600 dark:bg-gray-700 text-white font-semibold py-2 rounded-lg hover:bg-gray-700 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
          >
            Back to Login
          </button>
        </form>
      )}
    </>
  );
}
