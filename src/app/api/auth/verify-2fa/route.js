import { verifyTwoFactorCode } from '@/lib/twoFactorService';
import { prisma } from '@/lib/prisma';

export async function POST(req) {
  try {
    const { patientId, code } = await req.json();

    if (!patientId || !code) {
      return Response.json(
        { error: 'Missing patientId or code' },
        { status: 400 }
      );
    }

    // Fetch patient
    const patient = await prisma.patients.findUnique({
      where: { id: patientId },
      select: {
        id: true,
        two_factor_enabled: true,
        two_factor_secret: true,
      },
    });

    if (!patient) {
      return Response.json(
        { error: 'Patient not found' },
        { status: 404 }
      );
    }

    if (!patient.two_factor_enabled) {
      return Response.json(
        { error: '2FA is not enabled for this account' },
        { status: 400 }
      );
    }

    // Verify the code
    const isCodeValid = verifyTwoFactorCode(code, patient.two_factor_secret);
    if (!isCodeValid) {
      return Response.json(
        { error: 'Invalid or expired authentication code' },
        { status: 401 }
      );
    }

    return Response.json(
      { success: true, message: '2FA verification successful' },
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
