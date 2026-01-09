import { API_ENDPOINTS } from '@/constants';

export const loginUser = async (credentials) => {
  const response = await fetch(API_ENDPOINTS.auth.login, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Login failed');
  }

  return response.json();
};

export const signupUser = async (userData) => {
  const response = await fetch(API_ENDPOINTS.auth.signup, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Signup failed');
  }

  return response.json();
};

export const logoutUser = async () => {
  const response = await fetch(API_ENDPOINTS.auth.logout, {
    method: 'POST',
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Logout failed');
  }

  return response.json();
};
