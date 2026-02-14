import bcrypt from 'bcrypt';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      email,
      password,
      firstName,
      lastName,
      specialty,
      medicalLicenseNumber,
      workplaceName,
    } = body;

    // Validation for providers
    if (!email || !password || !firstName || !lastName || !specialty || !medicalLicenseNumber) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if provider already exists
    const existingProvider = await prisma.providers.findFirst({
      where: {
        OR: [
          { email: email },
          { medical_license_number: medicalLicenseNumber },
        ],
      },
    });

    if (existingProvider) {
      return NextResponse.json(
        { error: 'Email or medical license number already in use' },
        { status: 409 }
      );
    }

    // Hash password using bcrypt
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create provider in database
    const newProvider = await prisma.providers.create({
      data: {
        email,
        password_hash: passwordHash,
        first_name: firstName,
        last_name: lastName,
        specialty,
        medical_license_number: medicalLicenseNumber,
        workplace_name: workplaceName || null,
        is_verified: false,
      },
    });

    return NextResponse.json(
      {
        message: 'Provider account created successfully. Your account is pending admin approval.',
        userId: newProvider.id,
        status: 'pending_approval',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Provider signup error:', error);
    return NextResponse.json(
      { error: 'An error occurred during signup' },
      { status: 500 }
    );
  }
}
