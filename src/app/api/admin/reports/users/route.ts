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
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  const total = await prisma.user.count();
  const active = await prisma.user.count({ where: { is_active: true } });
  const growth7d = await Promise.all(
    Array.from({ length: 7 }).map(async (_, i) => {
      const start = startOfDay(6 - i);
      const end = startOfDay(5 - i);
      return prisma.user.count({ where: { created_at: { gte: start, lt: end } } });
    })
  );

  return NextResponse.json({ ok: true, data: { total, active, growth7d } });
}
