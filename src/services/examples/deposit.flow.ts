import { Prisma } from '@prisma/client';
import { prisma } from '@/database/prisma/client';
import crypto from 'crypto';
import { createDoubleEntryTransaction } from '../ledger.service';

export async function exampleDepositFlow(params: {
  userId: string;
  walletId: string;
  debitAccountId: string;
  creditAccountId: string;
  amount: string;
  currency: string;
}) {
  return prisma.$transaction(async tx => {
    const transaction = await tx.transaction.create({
      data: {
        id: crypto.randomUUID(),
        user_id: params.userId,
        wallet_id: params.walletId,
        currency: params.currency,
        amount: new Prisma.Decimal(params.amount),
        type: 'DEPOSIT',
        status: 'PENDING',
        updated_at: new Date()
      }
    });

    await createDoubleEntryTransaction(tx, {
      debitAccountId: params.debitAccountId,
      creditAccountId: params.creditAccountId,
      amount: new Prisma.Decimal(params.amount),
      referenceId: transaction.id,
      userId: params.userId
    });

    await tx.transaction.update({
      where: { id: transaction.id },
      data: { status: 'SUCCESS', updated_at: new Date() }
    });

    return transaction;
  });
}
