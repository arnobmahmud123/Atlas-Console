import { Prisma } from '@prisma/client';
import { prisma } from '@/database/prisma/client';
import { getWalletBalance } from '@/services/wallet.service';

export type WithdrawalValidationResult = {
  ok: boolean;
  errors: string[];
  balance?: Prisma.Decimal;
};

export async function validateWithdrawal(params: {
  userId: string;
  amount: Prisma.Decimal;
  dailyLimit: Prisma.Decimal;
}) : Promise<WithdrawalValidationResult> {
  const errors: string[] = [];

  const user = await prisma.user.findUnique({
    where: { id: params.userId },
    select: { is_active: true }
  });

  if (!user || !user.is_active) {
    errors.push('Account is frozen');
  }

  const kyc = await prisma.kyc.findFirst({
    where: { user_id: params.userId },
    orderBy: { created_at: 'desc' },
    select: { status: true }
  });

  if (!kyc || kyc.status !== 'APPROVED') {
    errors.push('KYC not approved');
  }

  const balance = await getWalletBalance(params.userId, 'MAIN');

  if (balance.lt(params.amount)) {
    errors.push('Insufficient balance');
  }

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const dailyTotalAgg = await prisma.transaction.aggregate({
    where: {
      user_id: params.userId,
      type: 'WITHDRAWAL',
      created_at: { gte: startOfDay },
      status: { in: ['PENDING', 'SUCCESS'] }
    },
    _sum: { amount: true }
  });

  const withdrawn = dailyTotalAgg._sum.amount ?? new Prisma.Decimal(0);
  if (withdrawn.plus(params.amount).gt(params.dailyLimit)) {
    errors.push('Daily withdrawal limit exceeded');
  }

  return {
    ok: errors.length === 0,
    errors,
    balance
  };
}
