import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Log for debugging (remove in production)
  console.log('🔒 Middleware checking:', pathname);

  // Protect /admin routes except the login page
  if (pathname.startsWith('/admin')) {
    // Allow login page and API routes
    if (pathname === '/admin/login' || pathname.startsWith('/api/')) {
      return NextResponse.next();
    }

    // Check for session cookie
    const session = req.cookies.get('sb_session')?.value;
    console.log('🍪 Session cookie:', session ? 'Found' : 'Missing');

    if (!session) {
      console.log('❌ No session - redirecting to login');
      const url = req.nextUrl.clone();
      url.pathname = '/admin/login';
      url.searchParams.set('from', pathname); // Remember where they wanted to go
      return NextResponse.redirect(url);
    }

    console.log('✅ Session found - allowing access');
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    // Explicitly exclude API routes from middleware
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
