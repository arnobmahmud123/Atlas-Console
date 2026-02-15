import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/modules/auth/services/auth-options';
import { prisma } from '@/database/prisma/client';
import { getWalletBalance } from '@/services/wallet.service';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const userId = session.user.id;
  const [
    deposits,
    withdrawals,
    positions,
    balance,
    recentTx,
    kyc,
    profilesSetting,
    todayProfitAgg,
    totalEarningsAgg,
    lastCreditedProfit,
    referralEarningsAgg
  ] = await Promise.all([
    prisma.deposit.count({ where: { user_id: userId, status: 'SUCCESS' } }),
    prisma.withdrawal.count({ where: { user_id: userId, status: 'PAID' } }),
    prisma.investmentPosition.count({ where: { user_id: userId, status: 'ACTIVE' } }),
    getWalletBalance(userId, 'MAIN'),
    prisma.transaction.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      take: 6
    }),
    prisma.kyc.findFirst({ where: { user_id: userId }, orderBy: { created_at: 'desc' } }),
    prisma.siteSettings.findUnique({ where: { key: 'demo_profiles' } }),
    prisma.profitAllocation.aggregate({
      where: { user_id: userId, status: 'CREDITED', credited_at: { gte: startOfToday } },
      _sum: { profit_amount: true },
      _count: { id: true }
    }),
    prisma.profitAllocation.aggregate({
      where: { user_id: userId, status: 'CREDITED' },
      _sum: { profit_amount: true }
    }),
    prisma.profitAllocation.findFirst({
      where: { user_id: userId, status: 'CREDITED', credited_at: { not: null } },
      orderBy: { credited_at: 'desc' },
      select: { profit_amount: true, credited_at: true }
    }),
    prisma.referralCommission.aggregate({
      where: { upline_user_id: userId },
      _sum: { amount: true }
    })
  ]);

  const todayProfit = todayProfitAgg._sum.profit_amount?.toString() ?? '0';
  const todayProfitStatus = Number(todayProfitAgg._count.id ?? 0) > 0 ? 'CREDITED' : 'NO_CREDIT';
  const totalEarnings = totalEarningsAgg._sum.profit_amount?.toString() ?? '0';
  const lastProfitAmount = lastCreditedProfit?.profit_amount?.toString() ?? '0';
  const lastProfitAt = lastCreditedProfit?.credited_at?.toISOString() ?? null;
  const referralEarnings = referralEarningsAgg._sum.amount?.toString() ?? '0';

  return NextResponse.json({
    ok: true,
    data: {
      deposits,
      withdrawals,
      positions,
      balance: balance.toString(),
      recentTx,
      kyc,
      profileMap: profilesSetting?.value ?? {},
      todayProfitStatus,
      todayProfit,
      lastProfitAmount,
      lastProfitAt,
      totalEarnings,
      referralEarnings
    }
  });
}
