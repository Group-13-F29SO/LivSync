import bcrypt from 'bcrypt';
import { prisma } from '@/lib/prisma';

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
