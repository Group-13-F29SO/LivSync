import bcrypt from 'bcrypt';
import { prisma } from '@/lib/prisma';

const FAILED_LOGIN_ATTEMPTS_KEY = 'failed_login_attempts';
const MAX_FAILED_ATTEMPTS = 3;
const LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutes

// In-memory store for failed login attempts (in production, use Redis)
const failedLoginAttempts = new Map();

/**
 * Track failed login attempts
 */
export function trackFailedLoginAttempt(identifier) {
  const now = Date.now();
  const attempts = failedLoginAttempts.get(identifier) || [];
  
  // Remove old attempts outside the lockout window
  const recentAttempts = attempts.filter(time => now - time < LOCKOUT_TIME);
  recentAttempts.push(now);
  
  failedLoginAttempts.set(identifier, recentAttempts);
  
  return recentAttempts.length;
}

/**
 * Check if account is locked
 */
export function isAccountLocked(identifier) {
  const attempts = failedLoginAttempts.get(identifier) || [];
  const now = Date.now();
  
  // Remove old attempts
  const recentAttempts = attempts.filter(time => now - time < LOCKOUT_TIME);
  
  return recentAttempts.length >= MAX_FAILED_ATTEMPTS;
}

/**
 * Reset failed login attempts
 */
export function resetFailedLoginAttempts(identifier) {
  failedLoginAttempts.delete(identifier);
}

/**
 * Authenticate an admin user
 * @param {string} email - Admin email
 * @param {string} password - Admin password
 * @returns {Promise<Object|null>} Admin object or null if authentication fails
 */
export async function authenticateAdmin(email, password) {
  try {
    const admin = await prisma.admins.findUnique({
      where: { email },
    });

    if (!admin) {
      return null;
    }

    const isValid = await bcrypt.compare(password, admin.password_hash);
    
    if (!isValid) {
      return null;
    }

    return {
      id: admin.id,
      email: admin.email,
      username: admin.username,
      role: 'admin',
    };
  } catch (error) {
    console.error('Admin authentication error:', error);
    return null;
  }
}

/**
 * Authenticate a patient user
 * @param {string} username - Patient username
 * @param {string} password - Patient password
 * @returns {Promise<Object|null>} Patient object or null if authentication fails
 */
export async function authenticatePatient(username, password) {
  try {
    const patient = await prisma.patients.findUnique({
      where: { username },
    });

    if (!patient) {
      return null;
    }

    const isValid = await bcrypt.compare(password, patient.password_hash);
    
    if (!isValid) {
      return null;
    }

    return {
      id: patient.id,
      email: patient.email,
      username: patient.username,
      firstName: patient.first_name,
      lastName: patient.last_name,
      role: 'patient',
    };
  } catch (error) {
    console.error('Patient authentication error:', error);
    return null;
  }
}

/**
 * Authenticate a provider user
 * @param {string} email - Provider email
 * @param {string} password - Provider password
 * @returns {Promise<Object|null>} Provider object or null if authentication fails
 */
export async function authenticateProvider(email, password) {
  try {
    const provider = await prisma.providers.findUnique({
      where: { email },
    });

    if (!provider) {
      return null;
    }

    const isValid = await bcrypt.compare(password, provider.password_hash);
    
    if (!isValid) {
      return null;
    }

    return {
      id: provider.id,
      email: provider.email,
      firstName: provider.first_name,
      lastName: provider.last_name,
      specialty: provider.specialty,
      role: 'provider',
    };
  } catch (error) {
    console.error('Provider authentication error:', error);
    return null;
  }
}
