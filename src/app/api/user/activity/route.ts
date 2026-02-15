import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/modules/auth/services/auth-options';
import { prisma } from '@/database/prisma/client';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const userId = session.user.id;

  const [deposits, withdrawals] = await Promise.all([
    prisma.deposit.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      take: 5
    }),
    prisma.withdrawal.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      take: 5
    })
  ]);

  return NextResponse.json({ ok: true, deposits, withdrawals });
}
