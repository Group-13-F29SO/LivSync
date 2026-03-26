'use client';

import { useState, useEffect } from 'react';
import { PrimaryButton, SecondaryButton, DangerButton } from '@/components/Settings/Buttons';

export default function TwoFactorModal({ userId, isOpen, onClose, onSuccess, mode: initialMode = 'enable' }) {
  const [step, setStep] = useState(1); // 1: show QR, 2: verify code, 3: disable confirmation
  const [qrCode, setQrCode] = useState(null);
  const [secret, setSecret] = useState(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mode, setMode] = useState(initialMode); // 'enable' or 'disable'

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  const handleGenerateQR = async () => {
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch(`/api/patient/2fa/setup?patientId=${userId}`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to generate QR code');
        return;
      }

      setQrCode(data.qrCode);
      setSecret(data.secret);
      setStep(2);
    } catch (err) {
      setError('An error occurred while generating QR code');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    setError(null);

    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }

    if (!password) {
      setError('Please enter your password');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/patient/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: userId,
          code: verificationCode,
          secret,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to verify code');
        return;
      }

      setStep(3);
      setTimeout(() => {
        onClose();
        setStep(1);
        setQrCode(null);
        setSecret(null);
        setVerificationCode('');
        setPassword('');
        if (onSuccess) onSuccess();
      }, 2000);
    } catch (err) {
      setError('An error occurred while verifying code');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisable = async () => {
    setError(null);

    if (!password) {
      setError('Please enter your password to disable 2FA');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/patient/2fa/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: userId,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to disable 2FA');
        return;
      }

      onClose();
      setStep(1);
      setPassword('');
      if (onSuccess) onSuccess();
    } catch (err) {
      setError('An error occurred while disabling 2FA');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-md w-full border border-slate-200 dark:border-gray-800">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-gray-800">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
            {mode === 'enable' ? 'Enable Two-Factor Authentication' : 'Disable Two-Factor Authentication'}
          </h2>
        </div>

        {/* Body */}
        <div className="px-6 py-6">
          {mode === 'enable' ? (
            <>
              {step === 1 && (
                <div className="space-y-4">
                  <p className="text-slate-600 dark:text-slate-400 text-sm">
                    Two-Factor Authentication adds an extra layer of security to your account. You'll need to enter a code from Microsoft Authenticator when logging in.
                  </p>
                  <ol className="list-decimal list-inside text-sm text-slate-600 dark:text-slate-400 space-y-2">
                    <li>Click the button below to generate a QR code</li>
                    <li>Open Microsoft Authenticator on your phone</li>
                    <li>Tap the + icon and select "Scan a QR code"</li>
                    <li>Scan the QR code shown on the next screen</li>
                    <li>Enter the 6-digit code to verify</li>
                  </ol>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                      Scan this QR code with Microsoft Authenticator:
                    </p>
                    {qrCode ? (
                      <div className="flex justify-center bg-slate-100 dark:bg-gray-800 p-4 rounded-lg">
                        <img src={qrCode} alt="2FA QR Code" className="w-48 h-48" />
                      </div>
                    ) : (
                      <div className="bg-slate-100 dark:bg-gray-800 p-4 rounded-lg h-48 flex items-center justify-center">
                        <p className="text-slate-500">Loading QR code...</p>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Verification Code (6 digits)
                    </label>
                    <input
                      type="text"
                      maxLength="6"
                      placeholder="000000"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.replace(/[^0-9]/g, ''))}
                      disabled={isLoading}
                      className="w-full px-4 py-2 bg-slate-100 dark:bg-gray-800 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-2xl tracking-widest disabled:opacity-50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Password
                    </label>
                    <input
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading}
                      className="w-full px-4 py-2 bg-slate-100 dark:bg-gray-800 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    />
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="text-center space-y-3">
                  <div className="flex justify-center">
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                  <p className="font-semibold text-slate-800 dark:text-slate-100">
                    Two-Factor Authentication Enabled!
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    You'll now need to enter a code from your authenticator app when logging in.
                  </p>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="space-y-4">
                <p className="text-slate-600 dark:text-slate-400 text-sm">
                  Disabling Two-Factor Authentication will remove the extra security from your account. You'll only need your password to log in.
                </p>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    className="w-full px-4 py-2 bg-slate-100 dark:bg-gray-800 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  />
                </div>
              </div>
            </>
          )}

          {/* Error Message */}
          {error && (
            <div className="text-red-600 dark:text-red-400 text-sm p-3 bg-red-50 dark:bg-red-950 rounded-lg mt-4">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-gray-800 flex gap-3">
          {mode === 'enable' ? (
            <>
              {step === 1 && (
                <>
                  <SecondaryButton onClick={onClose} disabled={isLoading} className="flex-1">
                    Cancel
                  </SecondaryButton>
                  <PrimaryButton onClick={handleGenerateQR} disabled={isLoading} className="flex-1">
                    {isLoading ? 'Generating...' : 'Generate QR Code'}
                  </PrimaryButton>
                </>
              )}
              {step === 2 && (
                <>
                  <SecondaryButton onClick={() => setStep(1)} disabled={isLoading} className="flex-1">
                    Back
                  </SecondaryButton>
                  <PrimaryButton onClick={handleVerifyCode} disabled={isLoading} className="flex-1">
                    {isLoading ? 'Verifying...' : 'Verify & Enable'}
                  </PrimaryButton>
                </>
              )}
              {step === 3 && (
                <PrimaryButton onClick={onClose} className="w-full">
                  Done
                </PrimaryButton>
              )}
            </>
          ) : (
            <>
              <SecondaryButton onClick={onClose} disabled={isLoading} className="flex-1">
                Keep Enabled
              </SecondaryButton>
              <DangerButton onClick={handleDisable} disabled={isLoading} className="flex-1">
                {isLoading ? 'Disabling...' : 'Disable 2FA'}
              </DangerButton>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
