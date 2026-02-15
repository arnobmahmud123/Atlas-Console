import type { NextRequest } from 'next/server';

const CSRF_COOKIE = 'csrf-token';

export function getCsrfToken(req: NextRequest) {
  return req.cookies.get(CSRF_COOKIE)?.value;
}

export function requireCsrf(req: NextRequest) {
  const header = req.headers.get('x-csrf-token');
  const cookie = getCsrfToken(req);

  // API clients can use double-submit token protection.
  if (header && cookie && header === cookie) {
    return true;
  }

  // Modern browsers send fetch metadata headers; accept same-origin/same-site requests.
  // This avoids false negatives when Origin/Referer are absent in some navigations.
  const fetchSite = req.headers.get('sec-fetch-site');
  if (fetchSite === 'same-origin' || fetchSite === 'same-site') {
    return true;
  }

  // Browser form submits usually do not include custom headers.
  // Allow only same-origin requests via Origin/Referer checks.
  const origin = req.headers.get('origin');
  const referer = req.headers.get('referer');
  const requestOrigin = req.nextUrl.origin;

  if (origin && origin === requestOrigin) {
    return true;
  }

  if (referer) {
    try {
      const refererOrigin = new URL(referer).origin;
      if (refererOrigin === requestOrigin) {
        return true;
      }
    } catch {
      return false;
    }
  }

  return false;
}

export function generateCsrfToken() {
  return crypto.randomUUID();
}

export function isStateChanging(method: string) {
  return ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase());
}

export function csrfCookieName() {
  return CSRF_COOKIE;
}
