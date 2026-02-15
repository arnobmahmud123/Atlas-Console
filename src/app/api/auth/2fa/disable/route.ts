import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/modules/auth/services/auth-options';
import { disableTwoFactor } from '@/modules/auth/services/two-factor.service';

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  await disableTwoFactor({ userId: session.user.id });
  return NextResponse.json({ ok: true });
}
