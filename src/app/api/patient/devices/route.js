/**
 * GET /api/patient/devices - Get all devices for authenticated patient
 * POST /api/patient/devices - Add a new device for authenticated patient
 */

import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

function getAuthenticatedUser(request) {
  const cookie = request.cookies.get('livsync_session');
  
  if (!cookie) {
    return null;
  }

  try {
    const session = JSON.parse(cookie.value);
    return session;
  } catch (error) {
    console.error('Failed to parse session cookie:', error);
    return null;
  }
}

/**
 * GET - Retrieve all devices for the authenticated patient
 */
export async function GET(request) {
  try {
    const session = getAuthenticatedUser(request);
    
    if (!session || !session.userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const patientId = session.userId;

    const devices = await prisma.devices.findMany({
      where: { patient_id: patientId },
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        device_name: true,
        device_type: true,
        device_model: true,
        is_active: true,
        battery_level: true,
        last_sync: true,
        paired_at: true,
        created_at: true,
        updated_at: true,
      }
    });

    return NextResponse.json(
      {
        success: true,
        data: devices
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error fetching devices:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch devices'
      },
      { status: 500 }
    );
  }
}

/**
 * POST - Add a new device for the authenticated patient
 */
export async function POST(request) {
  try {
    const session = getAuthenticatedUser(request);
    
    if (!session || !session.userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const patientId = session.userId;
    const body = await request.json();

    // Validate required fields
    const { device_name, device_type, device_model, battery_level } = body;

    if (!device_name || !device_type) {
      return NextResponse.json(
        {
          success: false,
          error: 'device_name and device_type are required'
        },
        { status: 400 }
      );
    }

    // Verify patient exists
    const patient = await prisma.patients.findUnique({
      where: { id: patientId }
    });

    if (!patient) {
      return NextResponse.json(
        { success: false, error: 'Patient not found' },
        { status: 404 }
      );
    }

    // Disconnect all existing active devices for this patient
    // Only one device can be active at a time
    await prisma.devices.updateMany({
      where: {
        patient_id: patientId,
        is_active: true
      },
      data: {
        is_active: false
      }
    });

    // Create new device (will be the only active device)
    const device = await prisma.devices.create({
      data: {
        patient_id: patientId,
        device_name,
        device_type,
        device_model: device_model || null,
        battery_level: battery_level || 100,
        is_active: true,
        paired_at: new Date(),
      },
      select: {
        id: true,
        device_name: true,
        device_type: true,
        device_model: true,
        is_active: true,
        battery_level: true,
        last_sync: true,
        paired_at: true,
        created_at: true,
        updated_at: true,
      }
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Device added successfully. Previous devices have been disconnected.',
        data: device
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error adding device:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to add device'
      },
      { status: 500 }
    );
  }
}
