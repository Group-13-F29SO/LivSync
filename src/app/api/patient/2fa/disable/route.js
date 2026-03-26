import { prisma } from '@/lib/prisma';
import { authenticatePatient } from '@/lib/auth';

export async function POST(req) {
  try {
    const { patientId, password } = await req.json();

    if (!patientId || !password) {
      return Response.json(
        { error: 'Missing patientId or password' },
        { status: 400 }
      );
    }

    // Fetch patient
    const patient = await prisma.patients.findUnique({
      where: { id: patientId },
      select: { id: true, username: true, two_factor_enabled: true },
    });

    if (!patient) {
      return Response.json(
        { error: 'Patient not found' },
        { status: 404 }
      );
    }

    if (!patient.two_factor_enabled) {
      return Response.json(
        { error: '2FA is not currently enabled' },
        { status: 400 }
      );
    }

    // Verify password
    const isPasswordValid = await authenticatePatient(patient.username, password);
    if (!isPasswordValid) {
      return Response.json(
        { error: 'Password is incorrect' },
        { status: 401 }
      );
    }

    // Disable 2FA
    await prisma.patients.update({
      where: { id: patientId },
      data: {
        two_factor_enabled: false,
        two_factor_secret: null,
      },
    });

    return Response.json(
      { success: true, message: '2FA disabled successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error disabling 2FA:', error);
    return Response.json(
      { error: 'Failed to disable 2FA' },
      { status: 500 }
    );
  }
}
