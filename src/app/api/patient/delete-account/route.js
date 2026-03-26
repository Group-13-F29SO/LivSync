import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticatePatient } from '@/lib/auth';

export async function POST(request) {
  try {
    const { patientId, username, password, verifyOnly } = await request.json();

    if (!patientId || !username || !password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Step 1: Verify credentials
    const authenticatedPatient = await authenticatePatient(username, password);

    if (!authenticatedPatient || authenticatedPatient.id !== patientId) {
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    // If only verifying (first step), return success without deleting
    if (verifyOnly) {
      return NextResponse.json(
        { success: true, message: 'Credentials verified successfully' },
        { status: 200 }
      );
    }

    // Step 2: Delete all associated data (only if not verifyOnly)
    try {
      // Delete in order respecting foreign key constraints
      // Delete alert thresholds
      await prisma.alert_thresholds.deleteMany({
        where: { patient_id: patientId },
      });

      // Delete biometric data
      await prisma.biometric_data.deleteMany({
        where: { patient_id: patientId },
      });

      // Delete critical events
      await prisma.critical_events.deleteMany({
        where: { patient_id: patientId },
      });

      // Delete goals
      await prisma.goals.deleteMany({
        where: { patient_id: patientId },
      });

      // Delete user achievements
      await prisma.user_achievements.deleteMany({
        where: { patient_id: patientId },
      });

      // Delete notifications
      await prisma.notifications.deleteMany({
        where: { patient_id: patientId },
      });

      // Delete connection requests (both where this patient is the patient and where they're involved)
      await prisma.connection_requests.deleteMany({
        where: { patient_id: patientId },
      });

      // Delete patient profile
      await prisma.patient_profiles.deleteMany({
        where: { patient_id: patientId },
      });

      // Delete patient
      await prisma.patients.delete({
        where: { id: patientId },
      });

      return NextResponse.json(
        { success: true, message: 'Account deleted successfully' },
        { status: 200 }
      );
    } catch (dbError) {
      console.error('Database deletion error:', dbError);
      return NextResponse.json(
        { error: 'Failed to delete account data' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Delete account error:', error);
    return NextResponse.json(
      { error: 'Failed to delete account' },
      { status: 500 }
    );
  }
}
