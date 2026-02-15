import { prisma } from '@/database/prisma/client';
import { Prisma } from '@prisma/client';

export async function getUserTransactionsSummary(
  userId: string,
  startDate: Date,
  endDate: Date
) {
  const [deposits, withdrawals, rewards, referrals] = await Promise.all([
    prisma.transaction.aggregate({
      where: {
        user_id: userId,
        type: 'DEPOSIT',
        created_at: { gte: startDate, lte: endDate },
        status: 'SUCCESS'
      },
      _sum: { amount: true }
    }),
    prisma.transaction.aggregate({
      where: {
        user_id: userId,
        type: 'WITHDRAWAL',
        created_at: { gte: startDate, lte: endDate },
        status: 'SUCCESS'
      },
      _sum: { amount: true }
    }),
    prisma.ledgerEntry.aggregate({
      where: {
        user_id: userId,
        created_at: { gte: startDate, lte: endDate },
        Transaction: { type: 'DIVIDEND' }
      },
      _sum: { amount: true }
    }),
    prisma.ledgerEntry.aggregate({
      where: {
        user_id: userId,
        created_at: { gte: startDate, lte: endDate },
        Transaction: { type: 'FEE' }
      },
      _sum: { amount: true }
    })
  ]);

  return {
    totalDeposits: deposits._sum.amount ?? new Prisma.Decimal(0),
    totalWithdrawals: withdrawals._sum.amount ?? new Prisma.Decimal(0),
    totalRewards: rewards._sum.amount ?? new Prisma.Decimal(0),
    totalReferralEarnings: referrals._sum.amount ?? new Prisma.Decimal(0)
  };
}
