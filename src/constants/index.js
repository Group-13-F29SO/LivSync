export const API_ENDPOINTS = {
  users: {
    login: '/users/login',
    register: '/users/register',
    profile: '/users/profile',
  },
  appointments: {
    list: '/appointments',
    create: '/appointments',
    get: (id) => `/appointments/${id}`,
    update: (id) => `/appointments/${id}`,
    cancel: (id) => `/appointments/${id}/cancel`,
  },
  doctors: {
    list: '/doctors',
    get: (id) => `/doctors/${id}`,
    availability: (id) => `/doctors/${id}/availability`,
  },
  medicalRecords: {
    list: '/medical-records',
    get: (id) => `/medical-records/${id}`,
    create: '/medical-records',
  },
}

export const USER_ROLES = {
  PATIENT: 'patient',
  DOCTOR: 'doctor',
  ADMIN: 'admin',
}
