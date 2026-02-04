'use client';

import { useState } from 'react';
import LoginForm from '@/components/LoginForm/LoginForm';
import ProviderLoginForm from '@/components/LoginForm/ProviderLoginForm';
import UserTypeSelector from '@/components/UserTypeSelector/UserTypeSelector';
import { useAuth } from '@/hooks/useAuth';

export default function LoginPage() {
  const [userType, setUserType] = useState(null);
  const { login, isLoading, error, setError } = useAuth();

  const handleLogin = async (formData) => {
    try {
      await login({ ...formData, userType: userType });
    } catch (err) {
      console.error('Login error:', err);
    }
  };

  const handleChangeUserType = (type) => {
    setUserType(type);
    setError('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-purple-500 to-pink-600 dark:from-blue-950 dark:via-purple-950 dark:to-pink-950">
      {/* Card */}
      <div className="bg-white dark:bg-gray-900 bg-opacity-30 dark:bg-opacity-40 backdrop-blur-sm rounded-2xl p-8 w-full max-w-md shadow-xl">
        {!userType ? (
          <>
            <UserTypeSelector userType={userType} onUserTypeChange={handleChangeUserType} />
          </>
        ) : (
          <>
            {userType === 'patient' && (
              <LoginForm 
                onSubmit={handleLogin} 
                isLoading={isLoading} 
                error={error}
              />
            )}

            {userType === 'provider' && (
              <ProviderLoginForm 
                onSubmit={handleLogin} 
                isLoading={isLoading} 
                error={error}
              />
            )}

            {/* Back to type selector button */}
            <button
              onClick={() => {
                setUserType(null);
                setError('');
              }}
              className="mt-4 w-full text-center text-gray-100 dark:text-gray-300 text-sm hover:underline"
            >
              Back to account type
            </button>
          </>
        )}
      </div>
    </div>
  );
}
