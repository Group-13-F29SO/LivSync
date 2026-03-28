import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateProvider } from '@/lib/auth';

export async function POST(request) {
  try {
    const { providerId, email, password, verifyOnly } = await request.json();

    if (!providerId || !email || !password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Step 1: Verify credentials
    const authenticatedProvider = await authenticateProvider(email, password);

    if (!authenticatedProvider || authenticatedProvider.id !== providerId) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // If only verifying (first step), return success without deleting
    if (verifyOnly) {
      return NextResponse.json(
        { success: true, message: 'Credentials verified successfully' },
        { status: 200 }
      );
    }

    // Step 2: Delete all associated data (only if not verifyOnly)
    try {
      // Delete in order respecting foreign key constraints
      // Delete appointment reminders
      await prisma.appointment_reminders.deleteMany({
        where: { provider_id: providerId },
      });

      // Delete appointments
      await prisma.appointments.deleteMany({
        where: { provider_id: providerId },
      });

      // Delete prescriptions
      await prisma.prescriptions.deleteMany({
        where: { provider_id: providerId },
      });

      // Delete notifications
      await prisma.notifications.deleteMany({
        where: { provider_id: providerId },
      });

      // Delete connection requests
      await prisma.connection_requests.deleteMany({
        where: { provider_id: providerId },
      });

      // Delete provider
      await prisma.providers.delete({
        where: { id: providerId },
      });

      return NextResponse.json(
        { success: true, message: 'Account deleted successfully' },
        { status: 200 }
      );
    } catch (dbError) {
      console.error('Database deletion error:', dbError);
      return NextResponse.json(
        { error: 'Failed to delete account data' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Delete account error:', error);
    return NextResponse.json(
      { error: 'Failed to delete account' },
      { status: 500 }
    );
  }
}
