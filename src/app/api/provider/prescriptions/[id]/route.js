import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

// GET: Get a specific prescription by ID
export async function GET(request, { params }) {
  try {
    const { id } = params;

    const prescription = await prisma.prescriptions.findUnique({
      where: { id },
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
    });

    if (!prescription) {
      return NextResponse.json(
        { error: 'Prescription not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ prescription }, { status: 200 });
  } catch (error) {
    console.error('Error fetching prescription:', error);
    return NextResponse.json(
      { error: 'Failed to fetch prescription' },
      { status: 500 }
    );
  }
}

// PUT: Update a prescription
export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();
    const {
      medicines, // Array of medicine objects
      notes,
      status,
      expiryDate,
    } = body;

    // Verify prescription exists
    const prescription = await prisma.prescriptions.findUnique({
      where: { id },
    });

    if (!prescription) {
      return NextResponse.json(
        { error: 'Prescription not found' },
        { status: 404 }
      );
    }

    // Update prescription fields and medicines
    const updateData = {
      notes: notes !== undefined ? notes : prescription.notes,
      status: status || prescription.status,
      expiry_date: expiryDate ? new Date(expiryDate) : prescription.expiry_date,
    };

    // If medicines are provided, delete old ones and create new ones
    if (medicines && Array.isArray(medicines) && medicines.length > 0) {
      // Validate each medicine
      for (const medicine of medicines) {
        if (!medicine.medicineName || !medicine.dosage || !medicine.frequency) {
          return NextResponse.json(
            { error: 'Each medicine must have: medicineName, dosage, frequency' },
            { status: 400 }
          );
        }
      }

      // Delete existing medicines
      await prisma.prescription_items.deleteMany({
        where: { prescription_id: id },
      });

      // Add updated medicines
      updateData.prescription_items = {
        create: medicines.map((medicine) => ({
          medicine_name: medicine.medicineName,
          dosage: medicine.dosage,
          frequency: medicine.frequency,
          duration: medicine.duration || null,
          instructions: medicine.instructions || null,
        })),
      };
    }

    const updatedPrescription = await prisma.prescriptions.update({
      where: { id },
      data: updateData,
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
    });

    return NextResponse.json(
      { prescription: updatedPrescription, message: 'Prescription updated successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating prescription:', error);
    return NextResponse.json(
      { error: 'Failed to update prescription' },
      { status: 500 }
    );
  }
}

// DELETE: Delete a prescription
export async function DELETE(request, { params }) {
  try {
    const { id } = params;

    // Verify prescription exists
    const prescription = await prisma.prescriptions.findUnique({
      where: { id },
    });

    if (!prescription) {
      return NextResponse.json(
        { error: 'Prescription not found' },
        { status: 404 }
      );
    }

    // Delete prescription (cascade will delete related items)
    await prisma.prescriptions.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: 'Prescription deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting prescription:', error);
    return NextResponse.json(
      { error: 'Failed to delete prescription' },
      { status: 500 }
    );
  }
}
