import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

// GET: Retrieve all prescriptions for a provider or filtered by patient
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const providerId = searchParams.get('providerId');
    const patientId = searchParams.get('patientId');
    const status = searchParams.get('status');

    if (!providerId) {
      return NextResponse.json(
        { error: 'Provider ID is required' },
        { status: 400 }
      );
    }

    const where = { provider_id: providerId };
    if (patientId) where.patient_id = patientId;
    if (status) where.status = status;

    const prescriptions = await prisma.prescriptions.findMany({
      where,
      include: {
        prescription_items: {
          orderBy: {
            created_at: 'asc',
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

// POST: Create a new prescription with multiple medicines
export async function POST(request) {
  try {
    const body = await request.json();
    const {
      providerId,
      patientId,
      medicines, // Array of { medicineName, dosage, frequency, duration, instructions }
      notes,
      expiryDate,
    } = body;

    // Validation
    if (!providerId || !patientId || !medicines || !Array.isArray(medicines) || medicines.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: providerId, patientId, medicines (array)' },
        { status: 400 }
      );
    }

    // Validate each medicine has required fields
    for (const medicine of medicines) {
      if (!medicine.medicineName || !medicine.dosage || !medicine.frequency) {
        return NextResponse.json(
          { error: 'Each medicine must have: medicineName, dosage, frequency' },
          { status: 400 }
        );
      }
    }

    // Verify provider exists
    const provider = await prisma.providers.findUnique({
      where: { id: providerId },
    });

    if (!provider) {
      return NextResponse.json(
        { error: 'Provider not found' },
        { status: 404 }
      );
    }

    // Verify patient exists and is connected to provider
    const patient = await prisma.patients.findUnique({
      where: { id: patientId },
      include: {
        patient_profiles: true,
      },
    });

    if (!patient) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      );
    }

    if (patient.provider_id !== providerId) {
      return NextResponse.json(
        { error: 'Patient is not connected to this provider' },
        { status: 403 }
      );
    }

    // Create prescription with medicines
    const prescription = await prisma.prescriptions.create({
      data: {
        provider_id: providerId,
        patient_id: patientId,
        notes: notes || null,
        expiry_date: expiryDate ? new Date(expiryDate) : null,
        prescription_items: {
          create: medicines.map((medicine) => ({
            medicine_name: medicine.medicineName,
            dosage: medicine.dosage,
            frequency: medicine.frequency,
            duration: medicine.duration || null,
            instructions: medicine.instructions || null,
          })),
        },
      },
      include: {
        prescription_items: true,
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
      },
    });

    return NextResponse.json(
      { prescription, message: 'Prescription created successfully' },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating prescription:', error);
    return NextResponse.json(
      { error: 'Failed to create prescription' },
      { status: 500 }
    );
  }
}
