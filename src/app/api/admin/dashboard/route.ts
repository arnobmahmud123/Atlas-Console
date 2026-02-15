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

  const [
    usersTotal,
    activeInvestments,
    depositsTotal,
    withdrawalsTotal,
    pendingDeposits,
    pendingWithdrawals,
    pendingKyc,
    recentTransactions,
    recentDeposits,
    recentWithdrawals,
    recentInvestments,
    recentUsers
  ] = await Promise.all([
    prisma.user.count(),
    prisma.investmentPosition.count({ where: { status: 'ACTIVE' } }),
    prisma.deposit.aggregate({ _sum: { amount: true } }),
    prisma.withdrawal.aggregate({ _sum: { amount: true } }),
    prisma.deposit.count({ where: { status: 'PENDING' } }),
    prisma.withdrawal.count({ where: { status: { in: ['PENDING', 'REVIEW'] } } }),
    prisma.kyc.count({ where: { status: 'PENDING' } }),
    prisma.transaction.findMany({ orderBy: { created_at: 'desc' }, take: 8 }),
    prisma.deposit.findMany({ orderBy: { created_at: 'desc' }, take: 5, include: { User: { select: { email: true } } } }),
    prisma.withdrawal.findMany({ orderBy: { created_at: 'desc' }, take: 5, include: { User_Withdrawal_user_idToUser: { select: { email: true } } } }),
    prisma.investmentPosition.findMany({ orderBy: { start_date: 'desc' }, take: 5, include: { User: { select: { email: true } }, InvestmentPlan: { select: { name: true } } } }),
    prisma.user.findMany({ orderBy: { created_at: 'desc' }, take: 5, select: { email: true, created_at: true } })
  ]);

  const dailyRevenue = await Promise.all(
    Array.from({ length: 7 }).map(async (_, i) => {
      const start = startOfDay(6 - i);
      const end = startOfDay(5 - i);
      const sum = await prisma.deposit.aggregate({
        where: { status: 'SUCCESS', created_at: { gte: start, lt: end } },
        _sum: { amount: true }
      });
      return Number(sum._sum.amount ?? 0);
    })
  );

  const userGrowth = await Promise.all(
    Array.from({ length: 7 }).map(async (_, i) => {
      const start = startOfDay(6 - i);
      const end = startOfDay(5 - i);
      const count = await prisma.user.count({ where: { created_at: { gte: start, lt: end } } });
      return count;
    })
  );

  return NextResponse.json({
    ok: true,
    data: {
      usersTotal,
      activeInvestments,
      depositsTotal,
      withdrawalsTotal,
      pendingDeposits,
      pendingWithdrawals,
      pendingKyc,
      recentTransactions,
      recentDeposits,
      recentWithdrawals,
      recentInvestments,
      recentUsers,
      dailyRevenue,
      userGrowth
    }
  });
}
