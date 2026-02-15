import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/modules/auth/services/auth-options';
import { prisma } from '@/database/prisma/client';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  const setting = await prisma.siteSettings.findUnique({ where: { key: 'referral_commissions' } });
  const levels = (setting?.value as { levels?: Array<{ level: number; percent: number }> })?.levels ?? [
    { level: 1, percent: 5 }
  ];

  const earnings = await prisma.transaction.groupBy({
    by: ['user_id'],
    where: { type: 'DIVIDEND', reference: { not: null } },
    _sum: { amount: true }
  });

  const users = await prisma.user.findMany({
    where: { id: { in: earnings.map(e => e.user_id) } },
    select: { id: true, email: true }
  });

  const earningsRows = earnings.map(e => ({
    user_id: e.user_id,
    email: users.find(u => u.id === e.user_id)?.email ?? 'User',
    total: e._sum.amount?.toString() ?? '0'
  }));

  return NextResponse.json({ ok: true, data: { levels, earningsRows } });
}
