import { prisma } from '@/database/prisma/client';
import { Prisma } from '@prisma/client';
import { calculateReferralCommission } from '@/services/referral-commission.service';

export async function getReferralTreeStats(userId: string) {
  const referrals = await prisma.referral.findMany({
    where: { parent_user_id: userId },
    orderBy: { level: 'asc' }
  });

  const activeLevels = Array.from(new Set(referrals.map(r => r.level)));

  const levelMap: Record<number, Prisma.Decimal> = {};
  for (const level of activeLevels) {
    levelMap[level] = calculateReferralCommission(new Prisma.Decimal(1), level);
  }

  const referralEarnings = await prisma.ledgerEntry.aggregate({
    where: {
      user_id: userId,
      Transaction: { type: 'FEE' }
    },
    _sum: { amount: true }
  });

  return {
    totalReferralEarnings: referralEarnings._sum.amount ?? new Prisma.Decimal(0),
    activeReferralLevels: activeLevels,
    commissionPerLevel: levelMap
  };
}
