export const API_ENDPOINTS = {
  auth: {
    login: '/api/auth/login',
    signup: '/api/auth/signup',
    logout: '/api/auth/logout',
  },
};

export const VALIDATION_RULES = {
  PASSWORD_MIN_LENGTH: 8,
  USERNAME_MIN_LENGTH: 3,
  AGE_MIN: 13,
  AGE_MAX: 120,
  HEIGHT_MIN: 50,
  HEIGHT_MAX: 300,
  WEIGHT_MIN: 20,
  WEIGHT_MAX: 500,
};
