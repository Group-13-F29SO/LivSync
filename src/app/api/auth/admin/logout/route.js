import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json(
    { message: 'Admin logout successful' },
    { status: 200 }
  );

  // Clear the admin session cookie
  response.cookies.delete('livsync_admin_session');

  return response;
}
