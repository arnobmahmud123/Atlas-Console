import { Prisma } from '@prisma/client';

const COMMISSION_RATES: Record<number, Prisma.Decimal> = {
  1: new Prisma.Decimal(0.05),
  2: new Prisma.Decimal(0.03),
  3: new Prisma.Decimal(0.01)
};

export function calculateReferralCommission(
  investmentAmount: Prisma.Decimal,
  referralLevel: number
) {
  const rate = COMMISSION_RATES[referralLevel] ?? new Prisma.Decimal(0);
  return investmentAmount.mul(rate);
}
