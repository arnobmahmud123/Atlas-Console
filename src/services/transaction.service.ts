import { prisma } from '@/database/prisma/client';
import type { Prisma } from '@prisma/client';
import crypto from 'crypto';

export type TransactionType =
  | 'DEPOSIT'
  | 'WITHDRAW'
  | 'WITHDRAWAL'
  | 'TRANSFER'
  | 'REWARD'
  | 'DIVIDEND'
  | 'INVESTMENT'
  | 'FEE'
  | 'REVERSAL';
export type TransactionStatus = 'PENDING' | 'SUCCESS' | 'FAILED';

export type CreateTransactionInput = {
  userId: string;
  amount: Prisma.Decimal;
  type: TransactionType;
  status: TransactionStatus;
};

function normalizeType(type: TransactionType) {
  if (type === 'WITHDRAW') return 'WITHDRAWAL';
  if (type === 'REWARD') return 'DIVIDEND';
  return type;
}

export async function createTransactionRecord(input: CreateTransactionInput) {
  const wallet = await prisma.wallet.findFirst({
    where: { user_id: input.userId, type: 'MAIN', deleted_at: null },
    select: { id: true, currency: true }
  });

  if (!wallet) {
    throw new Error('Main wallet not found');
  }

  return prisma.transaction.create({
    data: {
      id: crypto.randomUUID(),
      user_id: input.userId,
      wallet_id: wallet.id,
      currency: wallet.currency,
      amount: input.amount,
      type: normalizeType(input.type) as any,
      status: input.status,
      updated_at: new Date()
    }
  });
}

export async function updateTransactionStatus(id: string, status: TransactionStatus) {
  return prisma.transaction.update({
    where: { id },
    data: { status, updated_at: new Date() }
  });
}
