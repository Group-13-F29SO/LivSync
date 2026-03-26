import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');

    if (!patientId) {
      return NextResponse.json(
        { error: 'Missing patientId' },
        { status: 400 }
      );
    }

    // Get user preferences - for now we'll store this in a settings table or use a default
    // Since there's no settings table in the schema, we'll return default and handle it client-side
    const goalRemindersEnabled = true; // Default to enabled

    return NextResponse.json(
      { goalRemindersEnabled },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching goal reminders setting:', error);
    return NextResponse.json(
      { error: 'Failed to fetch goal reminders setting' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const { patientId, enabled } = await request.json();

    if (!patientId || enabled === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create a notification preference
    // We'll store this as a notification for now with a preference flag
    // In a real app, you'd have a user_preferences table
    
    // For now, we'll just return success and handle the setting client-side with localStorage
    return NextResponse.json(
      { success: true, goalRemindersEnabled: enabled },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating goal reminders setting:', error);
    return NextResponse.json(
      { error: 'Failed to update goal reminders setting' },
      { status: 500 }
    );
  }
}
