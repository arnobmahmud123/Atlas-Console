import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { Prisma } from '@prisma/client';
import { authOptions } from '@/modules/auth/services/auth-options';
import { prisma } from '@/database/prisma/client';

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfWeek() {
  const d = startOfToday();
  const day = d.getDay();
  const diff = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - diff);
  return d;
}

function startOfMonth() {
  const d = startOfToday();
  d.setDate(1);
  return d;
}

function startOfYear() {
  const d = startOfToday();
  d.setMonth(0, 1);
  return d;
}

function daysAgoStart(days: number) {
  const d = startOfToday();
  d.setDate(d.getDate() - days);
  return d;
}

async function sumProfit(userId: string, from: Date, to?: Date) {
  const where = {
    user_id: userId,
    type: 'DIVIDEND' as const,
    status: 'SUCCESS',
    created_at: to ? { gte: from, lt: to } : { gte: from }
  };

  const agg = await prisma.transaction.aggregate({ where, _sum: { amount: true } });
  return agg._sum.amount ?? new Prisma.Decimal(0);
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });

  const userId = session.user.id;
  const now = new Date();
  const todayStart = startOfToday();
  const yesterdayStart = daysAgoStart(1);
  const weekStart = startOfWeek();
  const monthStart = startOfMonth();
  const yearStart = startOfYear();
  const days90Start = daysAgoStart(90);

  const [today, yesterday, thisWeek, thisMonth, last90Days, thisYear] = await Promise.all([
    sumProfit(userId, todayStart, now),
    sumProfit(userId, yesterdayStart, todayStart),
    sumProfit(userId, weekStart, now),
    sumProfit(userId, monthStart, now),
    sumProfit(userId, days90Start, now),
    sumProfit(userId, yearStart, now)
  ]);

  return NextResponse.json({
    ok: true,
    data: {
      today: today.toString(),
      yesterday: yesterday.toString(),
      thisWeek: thisWeek.toString(),
      thisMonth: thisMonth.toString(),
      last90Days: last90Days.toString(),
      thisYear: thisYear.toString()
    }
  });
}
