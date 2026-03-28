import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

// GET: Retrieve all prescriptions for a patient
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');
    const status = searchParams.get('status');
    const providerId = searchParams.get('providerId');

    if (!patientId) {
      return NextResponse.json(
        { error: 'Patient ID is required' },
        { status: 400 }
      );
    }

    const where = { patient_id: patientId };
    if (status) where.status = status;
    if (providerId) where.provider_id = providerId;

    const prescriptions = await prisma.prescriptions.findMany({
      where,
      include: {
        prescription_items: {
          orderBy: {
            created_at: 'asc',
          },
        },
        providers: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            specialty: true,
            workplace_name: true,
            work_phone: true,
          },
        },
        patients: {
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
            patient_profiles: {
              select: {
                date_of_birth: true,
                height_cm: true,
                weight_kg: true,
              },
            },
          },
        },
      },
      orderBy: {
        issued_date: 'desc',
      },
    });

    return NextResponse.json({ prescriptions }, { status: 200 });
  } catch (error) {
    console.error('Error fetching prescriptions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch prescriptions' },
      { status: 500 }
    );
  }
}
