import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request) {
  try {
    const { patientId } = await request.json();

    if (!patientId) {
      return NextResponse.json(
        { error: 'Missing patientId' },
        { status: 400 }
      );
    }

    // Verify patient exists
    const patient = await prisma.patients.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      );
    }

    // Delete all patient data (respecting foreign key constraints)
    // These are deleted in order to avoid foreign key violations

    // Delete article feedback
    await prisma.article_feedback.deleteMany({
      where: { patient_id: patientId },
    });

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

    // Delete devices
    await prisma.devices.deleteMany({
      where: { patient_id: patientId },
    });

    // Delete connection requests (both as patient and potentially as provider)
    await prisma.connection_requests.deleteMany({
      where: { patient_id: patientId },
    });

    // Delete patient profile
    await prisma.patient_profiles.deleteMany({
      where: { patient_id: patientId },
    });

    // Note: Patient account record itself is NOT deleted, only the associated data

    return NextResponse.json(
      { 
        success: true, 
        message: 'All data has been successfully deleted. Your account remains active.' 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting patient data:', error);
    return NextResponse.json(
      { error: 'Failed to delete data. Please try again.' },
      { status: 500 }
    );
  }
}
