import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/modules/auth/services/auth-options';
import { prisma } from '@/database/prisma/client';
import { z } from 'zod';

const schema = z.object({
  range: z.enum(['7', '30', '90']).optional()
});

function startOfDay(daysAgo: number) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const parsed = schema.safeParse({ range: searchParams.get('range') ?? undefined });
  const range = parsed.success ? Number(parsed.data.range ?? '7') : 7;

  const deposits = await Promise.all(
    Array.from({ length: range }).map(async (_, i) => {
      const start = startOfDay(range - 1 - i);
      const end = startOfDay(range - 2 - i);
      const sum = await prisma.deposit.aggregate({
        where: { status: 'SUCCESS', created_at: { gte: start, lt: end } },
        _sum: { amount: true }
      });
      return { label: String(i), value: Number(sum._sum.amount ?? 0) };
    })
  );

  const investments = await Promise.all(
    Array.from({ length: range }).map(async (_, i) => {
      const start = startOfDay(range - 1 - i);
      const end = startOfDay(range - 2 - i);
      const count = await prisma.investmentPosition.count({ where: { start_date: { gte: start, lt: end } } });
      return { label: String(i), value: count };
    })
  );

  const users = await Promise.all(
    Array.from({ length: range }).map(async (_, i) => {
      const start = startOfDay(range - 1 - i);
      const end = startOfDay(range - 2 - i);
      const count = await prisma.user.count({ where: { created_at: { gte: start, lt: end } } });
      return { label: String(i), value: count };
    })
  );

  return NextResponse.json({ ok: true, deposits, investments, users });
}
