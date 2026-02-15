import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/modules/auth/services/auth-options';
import { prisma } from '@/database/prisma/client';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  const [users, deposits, withdrawals, investments] = await Promise.all([
    prisma.user.count(),
    prisma.deposit.count(),
    prisma.withdrawal.count(),
    prisma.investmentPosition.count()
  ]);

  return NextResponse.json({ ok: true, users, deposits, withdrawals, investments });
}
