import bcrypt from 'bcrypt';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      email,
      username,
      password,
      firstName,
      lastName,
      age,
      biologicalSex,
      height,
      weight,
    } = body;

    // Validation
    if (!email || !username || !password || !firstName || !lastName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.patients.findFirst({
      where: {
        OR: [
          { email: email },
          { username: username },
        ],
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email or username already in use' },
        { status: 409 }
      );
    }

    // Hash password using bcrypt
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user and profile in database
    const newUser = await prisma.patients.create({
      data: {
        email,
        username,
        password_hash: passwordHash,
        first_name: firstName,
        last_name: lastName,
        provider_consent_status: 'none',
        patient_profiles: {
          create: {
            date_of_birth: age ? new Date(new Date().getFullYear() - parseInt(age), 0, 1) : null,
            height_cm: height ? parseInt(height) : null,
            weight_kg: weight ? parseFloat(weight) : null,
            biological_sex: biologicalSex || null,
          },
        },
      },
      include: {
        patient_profiles: true,
      },
    });

    return NextResponse.json(
      {
        message: 'User created successfully',
        userId: newUser.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'An error occurred during signup' },
      { status: 500 }
    );
  }
}
