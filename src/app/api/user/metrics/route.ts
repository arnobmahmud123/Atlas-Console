import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/modules/auth/services/auth-options';
import { prisma } from '@/database/prisma/client';

function startOfDay(daysAgo: number) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const userId = session.user.id;

  const deposits = await Promise.all(
    Array.from({ length: 7 }).map(async (_, i) => {
      const start = startOfDay(6 - i);
      const end = startOfDay(5 - i);
      const sum = await prisma.deposit.aggregate({
        where: { user_id: userId, status: 'SUCCESS', created_at: { gte: start, lt: end } },
        _sum: { amount: true }
      });
      return { label: String(i), value: Number(sum._sum.amount ?? 0) };
    })
  );

  const withdrawals = await Promise.all(
    Array.from({ length: 7 }).map(async (_, i) => {
      const start = startOfDay(6 - i);
      const end = startOfDay(5 - i);
      const sum = await prisma.withdrawal.aggregate({
        where: { user_id: userId, status: 'PAID', created_at: { gte: start, lt: end } },
        _sum: { amount: true }
      });
      return { label: String(i), value: Number(sum._sum.amount ?? 0) };
    })
  );

  const earnings = await Promise.all(
    Array.from({ length: 7 }).map(async (_, i) => {
      const start = startOfDay(6 - i);
      const end = startOfDay(5 - i);
      const sum = await prisma.transaction.aggregate({
        where: { user_id: userId, type: 'DIVIDEND', created_at: { gte: start, lt: end } },
        _sum: { amount: true }
      });
      return { label: String(i), value: Number(sum._sum.amount ?? 0) };
    })
  );

  return NextResponse.json({ ok: true, deposits, withdrawals, earnings });
}
