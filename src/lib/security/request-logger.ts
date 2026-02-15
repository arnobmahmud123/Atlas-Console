import type { NextRequest } from 'next/server';

export function logRequest(req: NextRequest, status: number) {
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip')?.trim() ??
    'unknown';
  const ua = req.headers.get('user-agent') ?? 'unknown';
  const message = {
    method: req.method,
    path: req.nextUrl.pathname,
    status,
    ip,
    userAgent: ua
  };

  // Replace with a structured logger in production.
  console.log('[api]', JSON.stringify(message));
}
