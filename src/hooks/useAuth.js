import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { loginUser, logoutUser, signupUser } from '@/services/authService';
import { useLocalStorage } from './useLocalStorage';

export const useAuth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser, isStorageLoading] = useLocalStorage('user', null);
  const router = useRouter();

  const login = async (credentials) => {
    setIsLoading(true);
    setError('');

    try {
      const data = await loginUser(credentials);
      setUser(data.user);
      
      // Redirect based on user type
      if (data.user.userType === 'provider') {
        router.push('/provider/dashboard');
      } else {
        router.push('/dashboard');
      }
      
      return data;
    } catch (err) {
      const errorMessage = err.message || 'An error occurred during login';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (userData) => {
    setIsLoading(true);
    setError('');

    try {
      await signupUser(userData);
      router.push('/login');
      return true;
    } catch (err) {
      const errorMessage = err.message || 'An error occurred during signup';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    setError('');

    try {
      await logoutUser();
      setUser(null);
      router.push('/login');
    } catch (err) {
      const errorMessage = err.message || 'An error occurred during logout';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { user, login, signup, logout, isLoading: isLoading || isStorageLoading, error, setError };
};
