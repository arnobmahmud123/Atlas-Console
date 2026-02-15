import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/modules/auth/services/auth-options';
import { prisma } from '@/database/prisma/client';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const referrals = await prisma.referral.findMany({
    where: { parent_user_id: session.user.id },
    orderBy: { level: 'asc' },
    take: 50,
    include: { User_Referral_user_idToUser: { select: { email: true } } }
  });

  return NextResponse.json({ ok: true, data: referrals });
}
