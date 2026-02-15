import { Prisma, type PrismaClient } from '@prisma/client';
import crypto from 'crypto';

export type DoubleEntryInput = {
  debitAccountId: string;
  creditAccountId: string;
  amount: Prisma.Decimal;
  referenceId: string;
  userId?: string;
};

const SYSTEM_LEDGER_ACCOUNT_NOS = new Set(['1000', '2000', '3000', '4000', '4100']);

async function getLedgerAccountBalance(
  tx: PrismaClient | Prisma.TransactionClient,
  ledgerAccountId: string
) {
  const grouped = await tx.ledgerEntry.groupBy({
    by: ['direction'],
    where: { ledger_account_id: ledgerAccountId, deleted_at: null },
    _sum: { amount: true }
  });
  const debit = grouped.find(e => e.direction === 'DEBIT')?._sum.amount ?? new Prisma.Decimal(0);
  const credit = grouped.find(e => e.direction === 'CREDIT')?._sum.amount ?? new Prisma.Decimal(0);
  return debit.minus(credit);
}

export async function createDoubleEntryTransaction(
  tx: PrismaClient | Prisma.TransactionClient,
  input: DoubleEntryInput
) {
  if (input.debitAccountId === input.creditAccountId) {
    throw new Error('Debit and credit accounts must be different');
  }

  const accounts = await tx.ledgerAccount.findMany({
    where: { id: { in: [input.debitAccountId, input.creditAccountId] } },
    select: { id: true, wallet_id: true, user_id: true, account_no: true }
  });

  if (accounts.length !== 2) {
    throw new Error('Ledger accounts not found for double entry');
  }

  const debitAccount = accounts.find(acc => acc.id === input.debitAccountId);
  const creditAccount = accounts.find(acc => acc.id === input.creditAccountId);

  if (!debitAccount || !creditAccount) {
    throw new Error('Ledger accounts not found for double entry');
  }

  // A credit entry reduces account balance (balance = debit - credit).
  // Prevent non-system accounts from going below zero.
  if (!SYSTEM_LEDGER_ACCOUNT_NOS.has(creditAccount.account_no)) {
    const available = await getLedgerAccountBalance(tx, creditAccount.id);
    if (available.lt(input.amount)) {
      throw new Error('Insufficient balance');
    }
  }

  const entries = [
    {
      ledger_account_id: input.debitAccountId,
      wallet_id: debitAccount.wallet_id,
      amount: input.amount,
      direction: 'DEBIT' as const,
      transaction_id: input.referenceId,
      user_id: input.userId ?? debitAccount.user_id
    },
    {
      ledger_account_id: input.creditAccountId,
      wallet_id: creditAccount.wallet_id,
      amount: input.amount,
      direction: 'CREDIT' as const,
      transaction_id: input.referenceId,
      user_id: input.userId ?? creditAccount.user_id
    }
  ];

  await tx.ledgerEntry.createMany({
    data: entries.map(entry => ({
      ...entry,
      id: crypto.randomUUID(),
      updated_at: new Date(),
      user_id: entry.user_id ?? undefined
    }))
  });

  return { ok: true };
}
