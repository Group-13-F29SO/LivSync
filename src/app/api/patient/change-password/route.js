import bcrypt from 'bcrypt';
import { authenticatePatient } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req) {
  try {
    const { patientId, currentPassword, newPassword } = await req.json();

    // Validate required fields
    if (!patientId || !currentPassword || !newPassword) {
      return Response.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return Response.json(
        { error: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    // Fetch patient
    const patient = await prisma.patients.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      return Response.json(
        { error: 'Patient not found' },
        { status: 404 }
      );
    }

    // Verify current password
    const isPasswordValid = await authenticatePatient(patient.username, currentPassword);
    if (!isPasswordValid) {
      return Response.json(
        { error: 'Current password is incorrect' },
        { status: 401 }
      );
    }

    // Hash new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await prisma.patients.update({
      where: { id: patientId },
      data: { password_hash: hashedPassword },
    });

    return Response.json(
      { success: true, message: 'Password changed successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error changing password:', error);
    return Response.json(
      { error: 'Failed to change password' },
      { status: 500 }
    );
  }
}
