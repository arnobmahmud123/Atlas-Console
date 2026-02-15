import { Prisma } from '@prisma/client';
import { prisma } from '@/database/prisma/client';
import crypto from 'crypto';
import { calculateReferralCommission } from '@/services/referral-commission.service';
import { createDoubleEntryTransaction } from '@/services/ledger.service';

export async function payoutReferralCommission(params: {
  userId: string;
  investmentAmount: Prisma.Decimal;
  referenceId: string;
}) {
  return prisma.$transaction(async tx => {
    const chain = await tx.referral.findMany({
      where: { user_id: params.userId },
      orderBy: { level: 'asc' }
    });

    for (const referral of chain) {
      const commission = calculateReferralCommission(params.investmentAmount, referral.level);
      if (commission.lte(new Prisma.Decimal(0))) continue;

      const refAccount = await tx.ledgerAccount.findFirst({
        where: { user_id: referral.parent_user_id, deleted_at: null },
        select: { id: true }
      });

      const commissionAccount = await tx.ledgerAccount.findFirst({
        where: { account_no: '4100', deleted_at: null },
        select: { id: true }
      });

      if (!refAccount || !commissionAccount) {
        throw new Error('Ledger accounts not configured');
      }

      const wallet = await tx.wallet.findFirst({
        where: { user_id: referral.parent_user_id, type: 'MAIN', deleted_at: null }
      });

      if (!wallet) {
        throw new Error('Wallet not found');
      }

      const reference = `referral_payout:${params.referenceId}:${referral.level}:${referral.parent_user_id}`;
      let transaction = await tx.transaction.findUnique({ where: { reference } });
      if (!transaction) {
        transaction = await tx.transaction.create({
          data: {
            id: crypto.randomUUID(),
            user_id: referral.parent_user_id,
            wallet_id: wallet.id,
            currency: wallet.currency,
            type: 'DIVIDEND',
            amount: commission,
            status: 'SUCCESS',
            reference,
            updated_at: new Date()
          }
        });
      }

      const existingEntries = await tx.ledgerEntry.count({ where: { transaction_id: transaction.id } });
      if (existingEntries < 2) {
        await createDoubleEntryTransaction(tx, {
          debitAccountId: commissionAccount.id,
          creditAccountId: refAccount.id,
          amount: commission,
          referenceId: transaction.id,
          userId: referral.parent_user_id
        });
      }
    }
  });
}
