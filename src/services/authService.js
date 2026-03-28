import { API_ENDPOINTS } from '@/constants';

export const loginUser = async (credentials) => {
  const endpoint = credentials.userType === 'provider'
    ? API_ENDPOINTS.auth.loginProvider
    : API_ENDPOINTS.auth.login;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(credentials),
  });

  // Handle 2FA required response (202 Accepted)
  if (response.status === 202) {
    const data = await response.json();
    return {
      requiresTwoFactor: true,
      userId: data.userId,
      message: data.message,
    };
  }

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Login failed');
  }

  return response.json();
};

export const signupUser = async (userData) => {
  const endpoint = userData.userType === 'provider' 
    ? API_ENDPOINTS.auth.signupProvider 
    : API_ENDPOINTS.auth.signup;

  const response = await fetch(endpoint, {
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

export const forgotPassword = async (email, userType = 'patient') => {
  const response = await fetch(API_ENDPOINTS.auth.forgotPassword, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, userType }),
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Failed to send password reset email');
  }

  return response.json();
};

export const verifyResetToken = async (email, resetCode, userType = 'patient') => {
  const response = await fetch(API_ENDPOINTS.auth.verifyResetToken, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, resetCode, userType }),
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Invalid or expired reset code');
  }

  return response.json();
};

export const resetPassword = async (email, resetCode, newPassword, confirmPassword, userType = 'patient') => {
  const response = await fetch(API_ENDPOINTS.auth.resetPassword, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, resetCode, newPassword, confirmPassword, userType }),
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Failed to reset password');
  }

  return response.json();
};
