import { prisma } from '@/database/prisma/client';
import { Prisma } from '@prisma/client';

export async function getActiveInvestmentsSummary() {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [totalActive, roiToday, perPlan] = await Promise.all([
    prisma.investmentPosition.aggregate({
      where: { status: 'ACTIVE' },
      _sum: { invested_amount: true }
    }),
    prisma.ledgerEntry.aggregate({
      where: {
        created_at: { gte: startOfDay },
        Transaction: { type: 'DIVIDEND' }
      },
      _sum: { amount: true }
    }),
    prisma.investmentPosition.groupBy({
      by: ['plan_id'],
      where: { status: 'ACTIVE' },
      _count: { _all: true }
    })
  ]);

  return {
    totalActiveAmount: totalActive._sum.invested_amount ?? new Prisma.Decimal(0),
    totalRoiToday: roiToday._sum.amount ?? new Prisma.Decimal(0),
    usersPerPlan: perPlan.map(item => ({ planId: item.plan_id, users: item._count._all }))
  };
}
