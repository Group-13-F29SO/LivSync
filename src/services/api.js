import apiClient from '@/lib/apiClient'
import { API_ENDPOINTS } from '@/constants'

// User Services
export const userService = {
  login: async (email, password) => {
    const response = await apiClient.post(API_ENDPOINTS.users.login, {
      email,
      password,
    })
    return response.data
  },

  register: async (userData) => {
    const response = await apiClient.post(API_ENDPOINTS.users.register, userData)
    return response.data
  },

  getProfile: async () => {
    const response = await apiClient.get(API_ENDPOINTS.users.profile)
    return response.data
  },
}

// Appointment Services
export const appointmentService = {
  list: async (filters) => {
    const response = await apiClient.get(API_ENDPOINTS.appointments.list, {
      params: filters,
    })
    return response.data
  },

  get: async (id) => {
    const response = await apiClient.get(API_ENDPOINTS.appointments.get(id))
    return response.data
  },

  create: async (data) => {
    const response = await apiClient.post(API_ENDPOINTS.appointments.create, data)
    return response.data
  },

  cancel: async (id) => {
    const response = await apiClient.post(API_ENDPOINTS.appointments.cancel(id))
    return response.data
  },
}

// Medical Records Services
export const medicalRecordService = {
  list: async (patientId) => {
    const response = await apiClient.get(API_ENDPOINTS.medicalRecords.list, {
      params: { patientId },
    })
    return response.data
  },

  get: async (id) => {
    const response = await apiClient.get(API_ENDPOINTS.medicalRecords.get(id))
    return response.data
  },

  create: async (data) => {
    const response = await apiClient.post(API_ENDPOINTS.medicalRecords.create, data)
    return response.data
  },
}
