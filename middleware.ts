import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public assets and the login page + auth APIs
  const isPublic =
    pathname.startsWith('/_next') ||
    pathname.startsWith('/public') ||
    pathname === '/favicon.ico' ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/login');

  if (isPublic) {
    return NextResponse.next();
  }

  const token = request.cookies.get('auth_token')?.value;

  // Protect selected routes
  const protectedRoutes = ['/', '/logs', '/report'];
  const isProtected = protectedRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`));

  if (isProtected && !token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/logs/:path*', '/report/:path*', '/login', '/api/:path*', '/favicon.ico'],
};