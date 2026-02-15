import { Prisma } from '@prisma/client';
import { prisma } from '@/database/prisma/client';

export async function getWalletBalance(userId: string, walletType: string) {
  const normalizedType = walletType.toUpperCase();
  if (normalizedType !== 'MAIN' && normalizedType !== 'PROFIT') {
    return new Prisma.Decimal(0);
  }

  const accounts = await prisma.ledgerAccount.findMany({
    where: {
      user_id: userId,
      deleted_at: null,
      Wallet: { is: { type: normalizedType, deleted_at: null } }
    },
    select: { id: true }
  });

  if (accounts.length === 0) return new Prisma.Decimal(0);
  const accountIds = accounts.map(a => a.id);

  const entries = await prisma.ledgerEntry.groupBy({
    by: ['direction'],
    where: {
      ledger_account_id: { in: accountIds },
      deleted_at: null
    },
    _sum: { amount: true }
  });

  const debit = entries.find(e => e.direction === 'DEBIT')?._sum.amount ?? new Prisma.Decimal(0);
  const credit = entries.find(e => e.direction === 'CREDIT')?._sum.amount ?? new Prisma.Decimal(0);

  const net = debit.minus(credit);
  // Safety clamp for legacy negative states.
  return net.lt(0) ? new Prisma.Decimal(0) : net;
}
