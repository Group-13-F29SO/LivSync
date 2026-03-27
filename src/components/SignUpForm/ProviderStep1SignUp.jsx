'use client';

import { useState } from 'react';
import PasswordInput from '../PasswordInput';
import { isPasswordValid } from '@/utils/passwordValidation';

export default function ProviderStep1SignUp({ formData, handleChange, handleNext, isLoading }) {
  const [errors, setErrors] = useState({});

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};

    // Validate password complexity
    if (!isPasswordValid(formData.password)) {
      newErrors.password = 'Password must meet all complexity requirements';
    }

    // Validate confirm password
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    handleNext(e);
  };

  const handlePasswordChange = (field, value) => {
    handleChange(field, value);
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <>
      <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 via-purple-500 to-pink-600 bg-clip-text text-transparent text-center" style={{paddingBottom: '8px'}}>
        Welcome to LivSync
      </h1>
      <p className="text-center text-gray-600 mb-8 text-sm">
        Create your healthcare provider account
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-black text-sm font-medium mb-2">
            Email
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            placeholder="Enter your email"
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:border-purple-500 transition-colors"
            required
          />
        </div>

        <PasswordInput
          value={formData.password}
          onChange={(e) => handlePasswordChange('password', e.target.value)}
          label="Password"
          placeholder="Enter your password"
          showValidation={true}
          required
        />
        {errors.password && (
          <div className="text-red-600 text-sm py-2">
            {errors.password}
          </div>
        )}

        <div>
          <label className="block text-black text-sm font-medium mb-2">
            Confirm Password
          </label>
          <input
            type="password"
            value={formData.confirmPassword}
            onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
            placeholder="Confirm your password"
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:border-purple-500 transition-colors"
            required
          />
        </div>
        {errors.confirmPassword && (
          <div className="text-red-600 text-sm py-2">
            {errors.confirmPassword}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gradient-to-br from-blue-600 via-purple-500 to-pink-600 text-white font-semibold py-2 rounded-lg hover:shadow-lg transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Creating Account...' : 'Continue'}
        </button>
      </form>
    </>
  );
}
