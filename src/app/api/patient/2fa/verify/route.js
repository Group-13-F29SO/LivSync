import { verifyTwoFactorCode } from '@/lib/twoFactorService';
import { prisma } from '@/lib/prisma';
import { authenticatePatient } from '@/lib/auth';

export async function POST(req) {
  try {
    const { patientId, code, secret, password } = await req.json();

    if (!patientId || !code || !secret || !password) {
      return Response.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Fetch patient
    const patient = await prisma.patients.findUnique({
      where: { id: patientId },
      select: { id: true, username: true, password_hash: true },
    });

    if (!patient) {
      return Response.json(
        { error: 'Patient not found' },
        { status: 404 }
      );
    }

    // Verify password first (before enabling 2FA)
    const isPasswordValid = await authenticatePatient(patient.username, password);
    if (!isPasswordValid) {
      return Response.json(
        { error: 'Password is incorrect' },
        { status: 401 }
      );
    }

    // Verify the 2FA code
    const isCodeValid = verifyTwoFactorCode(code, secret);
    if (!isCodeValid) {
      return Response.json(
        { error: 'Invalid authentication code' },
        { status: 400 }
      );
    }

    // Save the secret and enable 2FA
    await prisma.patients.update({
      where: { id: patientId },
      data: {
        two_factor_secret: secret,
        two_factor_enabled: true,
      },
    });

    return Response.json(
      { success: true, message: '2FA enabled successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error verifying 2FA code:', error);
    return Response.json(
      { error: 'Failed to verify 2FA code' },
      { status: 500 }
    );
  }
}
