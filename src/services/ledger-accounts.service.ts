import { Prisma, type PrismaClient } from '@prisma/client';
import crypto from 'crypto';

export async function getSystemLedgerAccountByNo(
  tx: PrismaClient | Prisma.TransactionClient,
  accountNo: string
) {
  return tx.ledgerAccount.findUnique({ where: { account_no: accountNo } });
}

export async function getOrCreateUserMainLedgerAccount(
  tx: PrismaClient | Prisma.TransactionClient,
  userId: string
) {
  const now = new Date();
  const wallet =
    (await tx.wallet.findFirst({ where: { user_id: userId, type: 'MAIN', deleted_at: null } })) ??
    (await tx.wallet.create({
      data: {
        id: crypto.randomUUID(),
        user_id: userId,
        name: 'Main Wallet',
        currency: 'USD',
        type: 'MAIN',
        updated_at: now
      }
    }));

  const existing = await tx.ledgerAccount.findFirst({
    where: { user_id: userId, wallet_id: wallet.id, deleted_at: null },
    orderBy: { created_at: 'asc' }
  });
  if (existing) return existing;

  const accountNo = `U-${userId.slice(0, 8)}-MAIN`;
  return tx.ledgerAccount.create({
    data: {
      id: crypto.randomUUID(),
      user_id: userId,
      wallet_id: wallet.id,
      name: 'User Main',
      account_no: accountNo,
      updated_at: now
    }
  });
}

export async function getUserMainBalanceTx(
  tx: PrismaClient | Prisma.TransactionClient,
  userId: string
) {
  const accounts = await tx.ledgerAccount.findMany({
    where: { user_id: userId, deleted_at: null, Wallet: { is: { type: 'MAIN', deleted_at: null } } },
    select: { id: true }
  });
  if (accounts.length === 0) return new Prisma.Decimal(0);

  const ids = accounts.map(a => a.id);
  const rows = await tx.ledgerEntry.findMany({
    where: { ledger_account_id: { in: ids }, deleted_at: null },
    select: { amount: true, direction: true }
  });
  let sum = new Prisma.Decimal(0);
  for (const r of rows) {
    sum = r.direction === 'DEBIT' ? sum.plus(r.amount) : sum.minus(r.amount);
  }
  return sum;
}
