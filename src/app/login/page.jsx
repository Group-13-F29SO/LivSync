'use client';

import LoginForm from '@/components/LoginForm/LoginForm';
import { useAuth } from '@/hooks/useAuth';

export default function LoginPage() {
  const { login, isLoading, error, setError } = useAuth();

  const handleLogin = async (formData) => {
    try {
      await login(formData);
    } catch (err) {
      console.error('Login error:', err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-purple-500 to-pink-600">
      {/* Card */}
      <div className="bg-white bg-opacity-30 backdrop-blur-sm rounded-2xl p-8 w-full max-w-md shadow-xl">
        <LoginForm 
          onSubmit={handleLogin} 
          isLoading={isLoading} 
          error={error}
        />
      </div>
    </div>
  );
}
