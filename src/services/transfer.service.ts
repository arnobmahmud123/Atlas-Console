import { Prisma } from '@prisma/client';
import { runFinancialOperation } from '@/services/financial.service';
import { updateTransactionStatus } from '@/services/transaction.service';
import { createDoubleEntryTransaction } from '@/services/ledger.service';
import crypto from 'crypto';

export type TransferInput = {
  fromUserId: string;
  toUserId: string;
  amount: Prisma.Decimal;
};

export async function processWalletTransfer(input: TransferInput) {
  let transactionId: string | null = null;

  try {
    return await runFinancialOperation(async tx => {
      const fromAccount = await tx.ledgerAccount.findFirst({
        where: { user_id: input.fromUserId, deleted_at: null },
        select: { id: true, wallet_id: true }
      });
      const toAccount = await tx.ledgerAccount.findFirst({
        where: { user_id: input.toUserId, deleted_at: null },
        select: { id: true, wallet_id: true }
      });

      if (!fromAccount || !toAccount) {
        throw new Error('Ledger account not found');
      }

      const entries = await tx.ledgerEntry.groupBy({
        by: ['direction'],
        where: {
          ledger_account_id: fromAccount.id,
          deleted_at: null
        },
        _sum: { amount: true }
      });

      const debit = entries.find(e => e.direction === 'DEBIT')?._sum.amount ?? new Prisma.Decimal(0);
      const credit = entries.find(e => e.direction === 'CREDIT')?._sum.amount ?? new Prisma.Decimal(0);
      const balance = debit.minus(credit);

      if (balance.lt(input.amount)) {
        throw new Error('Insufficient balance');
      }

      const fromWallet = await tx.wallet.findUnique({ where: { id: fromAccount.wallet_id } });
      if (!fromWallet) throw new Error('Source wallet not found');

      const transaction = await tx.transaction.create({
        data: {
          id: crypto.randomUUID(),
          user_id: input.fromUserId,
          wallet_id: fromAccount.wallet_id,
          currency: fromWallet.currency,
          amount: input.amount,
          type: 'TRANSFER',
          status: 'PENDING',
          updated_at: new Date()
        }
      });

      transactionId = transaction.id;

      await createDoubleEntryTransaction(tx, {
        debitAccountId: toAccount.id,
        creditAccountId: fromAccount.id,
        amount: input.amount,
        referenceId: transaction.id,
        userId: input.fromUserId
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
