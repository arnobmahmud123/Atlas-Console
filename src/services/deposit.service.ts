import type { Prisma } from '@prisma/client';
import crypto from 'crypto';
import { runFinancialOperation } from '@/services/financial.service';
import { updateTransactionStatus } from '@/services/transaction.service';
import { createDoubleEntryTransaction } from '@/services/ledger.service';

export type DepositInput = {
  userId: string;
  amount: Prisma.Decimal;
  debitAccountId: string;
  creditAccountId: string;
  referenceId: string;
};

export async function processDeposit(input: DepositInput) {
  let transactionId: string | null = null;

  try {
    return await runFinancialOperation(async tx => {
      const wallet = await tx.wallet.findFirst({
        where: { user_id: input.userId, type: 'MAIN', deleted_at: null }
      });

      if (!wallet) {
        throw new Error('Wallet not found');
      }

      const transaction = await tx.transaction.create({
        data: {
          id: crypto.randomUUID(),
          user_id: input.userId,
          wallet_id: wallet.id,
          currency: wallet.currency,
          amount: input.amount,
          type: 'DEPOSIT',
          status: 'PENDING',
          updated_at: new Date()
        }
      });

      transactionId = transaction.id;

      await createDoubleEntryTransaction(tx, {
        debitAccountId: input.debitAccountId,
        creditAccountId: input.creditAccountId,
        amount: input.amount,
        referenceId: transaction.id,
        userId: input.userId
      });

      return tx.transaction.update({
        where: { id: transaction.id },
        data: { status: 'SUCCESS', updated_at: new Date() }
      });
    });
  } catch (error) {
    if (transactionId) {
      await updateTransactionStatus(transactionId, 'FAILED');
    }
    throw error;
  }
}
