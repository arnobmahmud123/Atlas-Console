import { Prisma } from '@prisma/client';
import { prisma } from '@/database/prisma/client';
import { createDoubleEntryTransaction } from '@/services/ledger.service';
import { sendEmail, emailWithdrawalApproved } from '@/services/email.service';
import crypto from 'crypto';

export async function approveWithdrawal(params: {
  withdrawalId: string;
  reviewedBy: string;
  debitAccountId: string;
  creditAccountId: string;
}) {
  const result = await prisma.$transaction(async tx => {
    const withdrawal = await tx.withdrawal.update({
      where: { id: params.withdrawalId },
      data: { status: 'APPROVED', reviewed_by: params.reviewedBy }
    });

    const wallet = await tx.wallet.findFirst({
      where: { user_id: withdrawal.user_id, type: 'MAIN', deleted_at: null }
    });

    if (!wallet) {
      throw new Error('Wallet not found');
    }

    const transaction = await tx.transaction.create({
      data: {
        id: crypto.randomUUID(),
        user_id: withdrawal.user_id,
        wallet_id: wallet.id,
        currency: wallet.currency,
        type: 'WITHDRAWAL',
        amount: new Prisma.Decimal(withdrawal.amount),
        status: 'SUCCESS',
        updated_at: new Date()
      }
    });

    await createDoubleEntryTransaction(tx, {
      debitAccountId: params.debitAccountId,
      creditAccountId: params.creditAccountId,
      amount: new Prisma.Decimal(withdrawal.amount),
      referenceId: transaction.id,
      userId: withdrawal.user_id
    });

    return tx.withdrawal.update({
      where: { id: withdrawal.id },
      data: { status: 'PAID' }
    });
  });

  const user = await prisma.user.findUnique({
    where: { id: result.user_id },
    select: { email: true }
  });
  if (user?.email) {
    const tmpl = emailWithdrawalApproved(result.amount.toString());
    await sendEmail({ to: user.email, ...tmpl });
  }

  return result;
}

export async function rejectWithdrawal(params: {
  withdrawalId: string;
  reviewedBy: string;
  reason?: string;
}) {
  return prisma.$transaction(async tx => {
    return tx.withdrawal.update({
      where: { id: params.withdrawalId },
      data: { status: 'REJECTED', reviewed_by: params.reviewedBy }
    });
  });
}
