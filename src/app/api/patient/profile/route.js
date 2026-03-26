import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');

    if (!patientId) {
      return NextResponse.json(
        { error: 'Patient ID is required' },
        { status: 400 }
      );
    }

    const patient = await prisma.patients.findUnique({
      where: { id: patientId },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        username: true,
        email: true,
        profile_picture_url: true,
        created_at: true,
        updated_at: true,
        patient_profiles: {
          select: {
            date_of_birth: true,
            height_cm: true,
            weight_kg: true,
            biological_sex: true,
          },
        },
      },
    });

    if (!patient) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        profile: {
          id: patient.id,
          firstName: patient.first_name,
          lastName: patient.last_name,
          username: patient.username,
          email: patient.email,
          profilePictureUrl: patient.profile_picture_url,
          dateOfBirth: patient.patient_profiles?.date_of_birth,
          heightCm: patient.patient_profiles?.height_cm,
          weightKg: patient.patient_profiles?.weight_kg,
          biologicalSex: patient.patient_profiles?.biological_sex,
          createdAt: patient.created_at,
          updatedAt: patient.updated_at,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching patient profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const {
      patientId,
      firstName,
      lastName,
      username,
      email,
      dateOfBirth,
      heightCm,
      weightKg,
      biologicalSex,
    } = body;

    if (!patientId) {
      return NextResponse.json(
        { error: 'Patient ID is required' },
        { status: 400 }
      );
    }

    // Fetch current patient to check if username is being changed
    const currentPatient = await prisma.patients.findUnique({
      where: { id: patientId },
      select: { username: true },
    });

    if (!currentPatient) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      );
    }

    // Validate new username if it's being changed
    if (username && username !== currentPatient.username) {
      // Check if the new username already exists
      const existingUser = await prisma.patients.findUnique({
        where: { username },
      });

      if (existingUser) {
        return NextResponse.json(
          { error: 'Username already taken. Please choose a different username.' },
          { status: 400 }
        );
      }
    }

    // Update patient basic info
    const updatedPatient = await prisma.patients.update({
      where: { id: patientId },
      data: {
        first_name: firstName,
        last_name: lastName,
        username: username || currentPatient.username,
        email: email,
        updated_at: new Date(),
      },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        username: true,
        email: true,
      },
    });

    // Update or create patient profile
    const updatedProfile = await prisma.patient_profiles.upsert({
      where: { patient_id: patientId },
      update: {
        date_of_birth: dateOfBirth ? new Date(dateOfBirth) : null,
        height_cm: heightCm ? parseInt(heightCm) : null,
        weight_kg: weightKg ? parseFloat(weightKg) : null,
        biological_sex: biologicalSex,
        updated_at: new Date(),
      },
      create: {
        patient_id: patientId,
        date_of_birth: dateOfBirth ? new Date(dateOfBirth) : null,
        height_cm: heightCm ? parseInt(heightCm) : null,
        weight_kg: weightKg ? parseFloat(weightKg) : null,
        biological_sex: biologicalSex,
      },
    });

    return NextResponse.json(
      {
        message: 'Profile updated successfully',
        profile: {
          ...updatedPatient,
          dateOfBirth: updatedProfile.date_of_birth,
          heightCm: updatedProfile.height_cm,
          weightKg: updatedProfile.weight_kg,
          biologicalSex: updatedProfile.biological_sex,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating patient profile:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
