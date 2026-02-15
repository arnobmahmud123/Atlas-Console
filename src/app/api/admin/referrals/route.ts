import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/modules/auth/services/auth-options';
import { prisma } from '@/database/prisma/client';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  const referrals = await prisma.referral.findMany({
    orderBy: { created_at: 'desc' },
    take: 100,
    include: {
      User_Referral_user_idToUser: { select: { email: true } },
      User_Referral_parent_user_idToUser: { select: { email: true } }
    }
  });

  return NextResponse.json({ ok: true, data: referrals });
}
