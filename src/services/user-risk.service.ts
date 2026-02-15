import { Prisma } from '@prisma/client';
import { prisma } from '@/database/prisma/client';

export type UserRiskInput = {
  userId: string;
  highDepositThreshold: Prisma.Decimal;
  deviceFingerprint?: string;
};

export async function calculateUserRisk(input: UserRiskInput) {
  let score = 0;

  const highDeposit = await prisma.deposit.findFirst({
    where: {
      user_id: input.userId,
      amount: { gte: input.highDepositThreshold },
      status: 'SUCCESS'
    }
  });

  if (highDeposit) score += 30;

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const recentWithdrawals = await prisma.withdrawal.count({
    where: {
      user_id: input.userId,
      created_at: { gte: oneHourAgo },
      status: { in: ['PENDING', 'APPROVED', 'PAID'] }
    }
  });

  if (recentWithdrawals >= 3) score += 25;

  if (input.deviceFingerprint) {
    const knownDevice = await prisma.deviceFingerprint.findUnique({
      where: { fingerprint: input.deviceFingerprint }
    });
    if (!knownDevice) score += 20;
  }

  const failedLogins = await prisma.loginHistory.count({
    where: {
      user_id: input.userId,
      succeeded: false,
      created_at: { gte: oneHourAgo }
    }
  });

  if (failedLogins >= 5) score += 25;

  return score;
}
