import { NextResponse, type NextRequest } from 'next/server';
import { withAuth } from 'next-auth/middleware';
import { getToken } from 'next-auth/jwt';
import { applySecureHeaders } from '@/lib/security/secure-headers';
import { rateLimit } from '@/lib/security/rate-limit';
import { csrfCookieName, generateCsrfToken, isStateChanging, requireCsrf } from '@/lib/security/csrf';
import { logRequest } from '@/lib/security/request-logger';

async function securityMiddleware(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    const proto = req.headers.get('x-forwarded-proto') ?? req.nextUrl.protocol.replace(':', '');
    if (proto !== 'https') {
      const url = req.nextUrl.clone();
      url.protocol = 'https:';
      return NextResponse.redirect(url);
    }
  }

  const res = NextResponse.next();

  // Secure headers
  applySecureHeaders(res);

  // CSRF token bootstrap
  const existing = req.cookies.get(csrfCookieName())?.value;
  if (!existing) {
    res.cookies.set(csrfCookieName(), generateCsrfToken(), {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/'
    });
  }

  // Rate limiting for API routes
  if (req.nextUrl.pathname.startsWith('/api')) {
    const token = await getToken({ req });
    const limit = await rateLimit(req, token?.sub);
    res.headers.set('X-RateLimit-Remaining', String(limit.remaining));
    res.headers.set('X-RateLimit-Reset', String(limit.resetAt));
    if (!limit.ok) {
      logRequest(req, 429);
      return NextResponse.json({ ok: false, error: 'Too many requests', message: 'Too many requests' }, { status: 429 });
    }
  }

  // CSRF protection for state-changing API routes
  if (req.nextUrl.pathname.startsWith('/api') && isStateChanging(req.method)) {
    const ok = requireCsrf(req);
    if (!ok) {
      logRequest(req, 403);
      return NextResponse.json(
        { ok: false, error: 'CSRF validation failed', message: 'CSRF validation failed' },
        { status: 403 }
      );
    }
  }

  logRequest(req, 200);
  return res;
}

export default withAuth(
  async function middleware(req) {
    const secured = await securityMiddleware(req);
    if (secured) return secured;
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;

        // Keep public/auth endpoints accessible without a session.
        if (
          path.startsWith('/api/public') ||
          path.startsWith('/api/auth') ||
          path === '/login' ||
          path === '/register' ||
          path === '/'
        ) {
          return true;
        }

        if (!token) return false;

        const role = token.role as string | undefined;

        if (path.startsWith('/admin')) {
          return role === 'ADMIN';
        }

        if (path.startsWith('/accountant')) {
          return role === 'ACCOUNTANT' || role === 'ADMIN';
        }

        if (path.startsWith('/staff')) {
          return role === 'ADMIN' || role === 'STAFF';
        }

        return true;
      }
    }
  }
);

export const config = {
  matcher: ['/admin/:path*', '/accountant/:path*', '/staff/:path*', '/dashboard/:path*', '/api/:path*']
};
