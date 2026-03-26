import { generateTwoFactorSecret, verifyTwoFactorCode } from '@/lib/twoFactorService';
import { prisma } from '@/lib/prisma';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const patientId = searchParams.get('patientId');

    if (!patientId) {
      return Response.json(
        { error: 'Missing patientId' },
        { status: 400 }
      );
    }

    // Fetch patient
    const patient = await prisma.patients.findUnique({
      where: { id: patientId },
      select: {
        id: true,
        username: true,
        email: true,
        two_factor_enabled: true,
      },
    });

    if (!patient) {
      return Response.json(
        { error: 'Patient not found' },
        { status: 404 }
      );
    }

    // Generate new secret and QR code
    const { secret, qrCode } = await generateTwoFactorSecret(patient.username, patient.email);

    return Response.json(
      {
        secret,
        qrCode,
        twoFactorEnabled: patient.two_factor_enabled,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error generating 2FA setup:', error);
    return Response.json(
      { error: 'Failed to generate 2FA setup' },
      { status: 500 }
    );
  }
}
