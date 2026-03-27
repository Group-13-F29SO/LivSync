'use client';

import { useState } from 'react';

export default function LoginForm({ onSubmit, isLoading, error, requiresTwoFactor = false, onForgotPassword }) {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    twoFactorCode: '',
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (requiresTwoFactor) {
      // Validate 2FA code format
      if (!formData.twoFactorCode || formData.twoFactorCode.length !== 6) {
        return;
      }
      onSubmit({
        username: formData.username,
        password: formData.password,
        twoFactorCode: formData.twoFactorCode,
      });
    } else {
      onSubmit({
        username: formData.username,
        password: formData.password,
      });
    }
  };

  return (
    <>
      <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 via-purple-500 to-pink-600 bg-clip-text text-transparent text-center" style={{paddingBottom: '8px'}}>
        {requiresTwoFactor ? 'Verify Your Identity' : 'Welcome Back'}
      </h1>
      <p className="text-center text-gray-100 dark:text-gray-300 mb-8 text-sm">
        {requiresTwoFactor 
          ? 'Enter the 6-digit code from your authenticator app'
          : 'Sign in to your LivSync account'
        }
      </p>

      {error && (
        <div className="mb-6 p-4 bg-red-500 bg-opacity-20 border border-red-500 rounded-lg">
          <p className="text-red-200 text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {!requiresTwoFactor ? (
          <>
            <div>
              <label className="block text-gray-100 dark:text-gray-200 text-sm font-medium mb-2">
                Username
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => handleChange('username', e.target.value)}
                placeholder="Enter your username"
                disabled={isLoading}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-purple-500 dark:focus:border-purple-400 transition-colors disabled:opacity-50"
                required
              />
            </div>

            <div>
              <label className="block text-gray-100 dark:text-gray-200 text-sm font-medium mb-2">
                Password
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                placeholder="Enter your password"
                disabled={isLoading}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-purple-500 dark:focus:border-purple-400 transition-colors disabled:opacity-50"
                required
              />
            </div>

            <div className="text-right">
              <button
                type="button"
                onClick={onForgotPassword}
                disabled={isLoading}
                className="text-blue-400 dark:text-blue-300 hover:underline text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Forgot Password?
              </button>
            </div>
          </>
        ) : (
          <div>
            <label className="block text-gray-100 dark:text-gray-200 text-sm font-medium mb-2">
              Authentication Code
            </label>
            <input
              type="text"
              value={formData.twoFactorCode}
              onChange={(e) => {
                const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
                handleChange('twoFactorCode', value);
              }}
              placeholder="000000"
              maxLength="6"
              disabled={isLoading}
              autoFocus
              className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-purple-500 dark:focus:border-purple-400 transition-colors disabled:opacity-50 text-center text-2xl tracking-widest font-mono"
              required
            />
            <p className="text-xs text-gray-300 dark:text-gray-400 mt-2">
              Check your Microsoft Authenticator app
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading || (requiresTwoFactor && formData.twoFactorCode.length !== 6)}
          className="w-full bg-gradient-to-br from-blue-600 via-purple-500 to-pink-600 text-white font-semibold py-2 rounded-lg hover:shadow-lg transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (requiresTwoFactor ? 'Verifying...' : 'Signing In...') : (requiresTwoFactor ? 'Verify' : 'Sign In')}
        </button>

        {!requiresTwoFactor && (
          <div className="text-center text-sm">
            <span className="text-gray-100 dark:text-gray-300">Don't have an account? </span>
            <a href="/signup" className="text-blue-400 dark:text-blue-300 hover:underline font-medium">
              Sign up
            </a>
          </div>
        )}
      </form>
    </>
  );
}
