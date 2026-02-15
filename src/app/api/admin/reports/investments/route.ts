import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/modules/auth/services/auth-options';
import { prisma } from '@/database/prisma/client';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  const totalActive = await prisma.investmentPosition.aggregate({
    where: { status: 'ACTIVE' },
    _sum: { invested_amount: true }
  });

  const planCounts = await prisma.investmentPosition.groupBy({
    by: ['plan_id'],
    _count: { id: true }
  });

  const plans = await prisma.investmentPlan.findMany({
    select: { id: true, name: true }
  });

  return NextResponse.json({ ok: true, data: { totalActive, planCounts, plans } });
}
