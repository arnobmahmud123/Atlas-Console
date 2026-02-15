import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/modules/auth/services/auth-options';
import { enableTwoFactor } from '@/modules/auth/services/two-factor.service';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const token = String(body?.token ?? '');
  if (!token) {
    return NextResponse.json({ ok: false, message: 'Verification code is required' }, { status: 400 });
  }

  try {
    await enableTwoFactor({ userId: session.user.id, token });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to enable 2FA';
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
