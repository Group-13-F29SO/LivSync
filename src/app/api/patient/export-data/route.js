import { NextResponse } from 'next/server';
import { compileUserData, generateExportFilename } from '@/services/dataExportService';

/**
 * JSON replacer function to handle BigInt serialization
 */
function jsonReplacer(key, value) {
  if (typeof value === 'bigint') {
    return value.toString();
  }
  return value;
}

export async function POST(request) {
  try {
    const { patientId } = await request.json();

    if (!patientId) {
      return NextResponse.json({ error: 'Patient ID is required' }, { status: 400 });
    }

    // Compile all user data
    const compiledData = await compileUserData(patientId);

    // Return success with data ready to download
    return NextResponse.json(
      {
        success: true,
        message: 'Data export completed successfully',
        data: compiledData,
        fileName: generateExportFilename(compiledData.user.username),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error exporting data:', error);

    if (error.message === 'Patient not found') {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    return NextResponse.json(
      {
        error: 'Failed to export data',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');

    if (!patientId) {
      return NextResponse.json({ error: 'Patient ID is required' }, { status: 400 });
    }

    // Compile all user data
    const compiledData = await compileUserData(patientId);

    // Set headers to trigger file download
    const fileName = generateExportFilename(compiledData.user.username);
    const headers = new Headers();
    headers.set('Content-Type', 'application/json');
    headers.set(
      'Content-Disposition',
      `attachment; filename="${fileName}"`
    );

    return new Response(JSON.stringify(compiledData, jsonReplacer, 2), {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error('Error exporting data:', error);

    if (error.message === 'Patient not found') {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 });
    }

    return NextResponse.json(
      {
        error: 'Failed to export data',
        details: error.message,
      },
      { status: 500 }
    );
  }
}
