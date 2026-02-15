import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/modules/auth/services/auth-options';
import { getReferralTreeStats } from '@/services/referral-stats.service';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const stats = await getReferralTreeStats(session.user.id);
  return NextResponse.json({ ok: true, data: stats });
}
