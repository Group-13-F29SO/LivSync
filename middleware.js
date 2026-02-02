import { NextResponse } from 'next/server';

export function middleware(request) {
  const pathname = request.nextUrl.pathname;

  // Protected routes that require authentication
  const protectedRoutes = ['/dashboard', '/goals', '/badges', '/chat'];
  
  // Admin routes that require admin authentication
  const adminRoutes = ['/admin/dashboard'];

  // Check if current route is an admin route
  const isAdminRoute = adminRoutes.some(route => 
    pathname.startsWith(route)
  );

  if (isAdminRoute) {
    // Check for admin session in cookies
    const adminSessionCookie = request.cookies.get('livsync_admin_session');

    // If no admin session, redirect to admin login
    if (!adminSessionCookie) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    // Verify it's actually an admin session
    try {
      const session = JSON.parse(adminSessionCookie.value);
      if (session.role !== 'admin') {
        return NextResponse.redirect(new URL('/admin/login', request.url));
      }
    } catch (error) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  // Check if current route is a protected patient route
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  );

  if (isProtectedRoute) {
    // Check for session in cookies
    const sessionCookie = request.cookies.get('livsync_session');

    // If no session, redirect to login
    if (!sessionCookie) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Allow public routes and authenticated users to proceed
  return NextResponse.next();
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
