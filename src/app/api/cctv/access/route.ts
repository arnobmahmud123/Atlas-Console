import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/modules/auth/services/auth-options';
import { getSetting } from '@/services/site-settings.service';
import { createCctvAccessToken, cctvCookieName, hashCctvPassword } from '@/lib/security/cctv-access';

const schema = z.object({
  password: z.string().min(1)
});

type CctvStoredSettings = {
  passwordRequired?: boolean;
  passwordHash?: string;
  passwordSalt?: string;
};

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: 'Password is required' }, { status: 400 });
  }

  const setting = await getSetting('settings_cctv');
  const value = (setting?.value ?? null) as CctvStoredSettings | null;
  if (!value?.passwordRequired) {
    return NextResponse.json({ ok: true, message: 'Password not required' });
  }

  if (!value.passwordHash || !value.passwordSalt) {
    return NextResponse.json({ ok: false, message: 'CCTV password is not configured' }, { status: 400 });
  }

  const provided = hashCctvPassword(parsed.data.password, value.passwordSalt);
  if (provided !== value.passwordHash) {
    return NextResponse.json({ ok: false, message: 'Invalid CCTV password' }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true, message: 'Access granted' });
  res.cookies.set(cctvCookieName(), createCctvAccessToken(session.user.id), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 12
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(cctvCookieName(), '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0
  });
  return res;
}

