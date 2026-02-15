import { Prisma } from '@prisma/client';
import { prisma } from '@/database/prisma/client';

export type TransactionRiskInput = {
  userId: string;
  amount: Prisma.Decimal;
  ipAddress?: string;
  deviceFingerprint?: string;
  largeThreshold: Prisma.Decimal;
};

export async function calculateTransactionRisk(input: TransactionRiskInput) {
  let score = 0;

  if (input.amount.greaterThanOrEqualTo(input.largeThreshold)) {
    score += 40;
  }

  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  const recentCount = await prisma.transaction.count({
    where: {
      user_id: input.userId,
      created_at: { gte: fiveMinutesAgo },
      status: { in: ['PENDING', 'SUCCESS'] }
    }
  });

  if (recentCount >= 5) {
    score += 25;
  }

  if (input.deviceFingerprint) {
    const knownDevice = await prisma.deviceFingerprint.findUnique({
      where: { fingerprint: input.deviceFingerprint }
    });
    if (!knownDevice) score += 20;
  }

  if (input.ipAddress) {
    const knownIp = await prisma.loginHistory.findFirst({
      where: {
        user_id: input.userId,
        ip_address: input.ipAddress,
        succeeded: true
      }
    });
    if (!knownIp) score += 15;
  }

  return score;
}
