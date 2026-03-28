import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const providerId = searchParams.get('providerId');

    if (!providerId) {
      return NextResponse.json(
        { error: 'Provider ID is required' },
        { status: 400 }
      );
    }

    const provider = await prisma.providers.findUnique({
      where: { id: providerId },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        medical_license_number: true,
        workplace_name: true,
        work_phone: true,
        specialty: true,
        is_verified: true,
        created_at: true,
      },
    });

    if (!provider) {
      return NextResponse.json(
        { error: 'Provider not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        profile: {
          id: provider.id,
          firstName: provider.first_name,
          lastName: provider.last_name,
          email: provider.email,
          medicalLicenseNumber: provider.medical_license_number,
          workplaceName: provider.workplace_name,
          workPhone: provider.work_phone,
          specialty: provider.specialty,
          isVerified: provider.is_verified,
          createdAt: provider.created_at,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching provider profile:', error);
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
      providerId,
      firstName,
      lastName,
      email,
      workplaceName,
      workPhone,
      specialty,
    } = body;

    if (!providerId) {
      return NextResponse.json(
        { error: 'Provider ID is required' },
        { status: 400 }
      );
    }

    // Fetch current provider to check if email is being changed
    const currentProvider = await prisma.providers.findUnique({
      where: { id: providerId },
      select: { email: true },
    });

    if (!currentProvider) {
      return NextResponse.json(
        { error: 'Provider not found' },
        { status: 404 }
      );
    }

    // Validate new email if it's being changed
    if (email && email !== currentProvider.email) {
      // Check if the new email already exists
      const existingProvider = await prisma.providers.findUnique({
        where: { email },
      });

      if (existingProvider) {
        return NextResponse.json(
          { error: 'Email already in use. Please choose a different email.' },
          { status: 400 }
        );
      }
    }

    // Update provider info
    const updatedProvider = await prisma.providers.update({
      where: { id: providerId },
      data: {
        first_name: firstName,
        last_name: lastName,
        email: email || currentProvider.email,
        workplace_name: workplaceName,
        work_phone: workPhone,
        specialty: specialty,
      },
      select: {
        id: true,
        first_name: true,
        last_name: true,
        email: true,
        medical_license_number: true,
        workplace_name: true,
        work_phone: true,
        specialty: true,
        is_verified: true,
        created_at: true,
      },
    });

    return NextResponse.json(
      {
        profile: {
          id: updatedProvider.id,
          firstName: updatedProvider.first_name,
          lastName: updatedProvider.last_name,
          email: updatedProvider.email,
          medicalLicenseNumber: updatedProvider.medical_license_number,
          workplaceName: updatedProvider.workplace_name,
          workPhone: updatedProvider.work_phone,
          specialty: updatedProvider.specialty,
          isVerified: updatedProvider.is_verified,
          createdAt: updatedProvider.created_at,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating provider profile:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
