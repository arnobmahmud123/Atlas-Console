import { cookies, headers } from 'next/headers';

type FetchInit = RequestInit & { next?: { revalidate?: number } };

export async function serverFetch(path: string, init: FetchInit = {}) {
  const hdrs = new Headers(init.headers ?? {});
  const cookieStore = await cookies();
  // Avoid `cookieStore.toString()` which triggers Next.js "sync dynamic APIs" warnings in Next 15.
  const cookieHeader = cookieStore
    .getAll()
    .map(c => `${c.name}=${c.value}`)
    .join('; ');
  if (cookieHeader) hdrs.set('cookie', cookieHeader);

  const h = await headers();
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000';
  const proto = h.get('x-forwarded-proto') ?? (host.includes('localhost') ? 'http' : 'https');
  const url = path.startsWith('http') ? path : `${proto}://${host}${path}`;

  const res = await fetch(url, { ...init, headers: hdrs, cache: 'no-store' });
  return res;
}

export async function safeJson<T = any>(res: Response): Promise<T | null> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}
