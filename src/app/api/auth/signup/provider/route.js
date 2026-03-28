import bcrypt from 'bcrypt';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

// Password validation rules
const PASSWORD_RULES = {
  minLength: 8,
  upperCase: /[A-Z]/,
  lowerCase: /[a-z]/,
  number: /[0-9]/,
  specialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/,
};

function isPasswordValid(password) {
  return (
    password.length >= PASSWORD_RULES.minLength &&
    PASSWORD_RULES.upperCase.test(password) &&
    PASSWORD_RULES.lowerCase.test(password) &&
    PASSWORD_RULES.number.test(password) &&
    PASSWORD_RULES.specialChar.test(password)
  );
}

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

    // Validate password complexity
    if (!isPasswordValid(password)) {
      return NextResponse.json(
        { 
          error: 'Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number, and one special character' 
        },
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
