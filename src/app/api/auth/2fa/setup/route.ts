import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/modules/auth/services/auth-options';
import { setupTwoFactor } from '@/modules/auth/services/two-factor.service';

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const result = await setupTwoFactor({
    userId: session.user.id,
    label: `SaaS App (${session.user.id})`
  });

  return NextResponse.json({
    ok: true,
    qrCodeUrl: result.qrCodeDataUrl,
    secret: result.secret,
    recoveryCodes: result.recoveryCodes
  });
}
