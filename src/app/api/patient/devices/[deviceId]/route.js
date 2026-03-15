/**
 * PATCH /api/patient/devices/[deviceId] - Update device status (connect/disconnect)
 * DELETE /api/patient/devices/[deviceId] - Remove a device
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
 * PATCH - Update device status (connect/disconnect or update battery level)
 */
export async function PATCH(request, { params }) {
  try {
    const session = getAuthenticatedUser(request);
    
    if (!session || !session.userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const patientId = session.userId;
    const { deviceId } = params;
    const body = await request.json();

    // Verify device belongs to patient
    const device = await prisma.devices.findFirst({
      where: {
        id: deviceId,
        patient_id: patientId
      }
    });

    if (!device) {
      return NextResponse.json(
        { success: false, error: 'Device not found' },
        { status: 404 }
      );
    }

    // Prepare update object
    const updateData = {};

    if (body.is_active !== undefined) {
      updateData.is_active = body.is_active;
    }

    if (body.battery_level !== undefined) {
      updateData.battery_level = body.battery_level;
    }

    if (body.last_sync !== undefined) {
      updateData.last_sync = new Date(body.last_sync);
    }

    // Update device
    const updatedDevice = await prisma.devices.update({
      where: { id: deviceId },
      data: updateData,
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
        message: 'Device updated successfully',
        data: updatedDevice
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error updating device:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to update device'
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Remove a device
 * Note: This does not remove the biometric data associated with this device
 */
export async function DELETE(request, { params }) {
  try {
    const session = getAuthenticatedUser(request);
    
    if (!session || !session.userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const patientId = session.userId;
    const { deviceId } = params;

    // Verify device belongs to patient
    const device = await prisma.devices.findFirst({
      where: {
        id: deviceId,
        patient_id: patientId
      }
    });

    if (!device) {
      return NextResponse.json(
        { success: false, error: 'Device not found' },
        { status: 404 }
      );
    }

    // Delete device (biometric data is NOT deleted)
    await prisma.devices.delete({
      where: { id: deviceId }
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Device removed successfully. Your health data remains intact.'
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error deleting device:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to remove device'
      },
      { status: 500 }
    );
  }
}
