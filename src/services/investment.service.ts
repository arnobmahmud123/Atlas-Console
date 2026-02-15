import { Prisma } from '@prisma/client';
import { prisma } from '@/database/prisma/client';
import { createDoubleEntryTransaction } from '@/services/ledger.service';
import crypto from 'crypto';

export async function createInvestmentPosition(
  userId: string,
  planId: string,
  amount: Prisma.Decimal
) {
  return prisma.$transaction(async tx => {
    const kyc = await tx.kyc.findFirst({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      select: { status: true }
    });

    if (!kyc || kyc.status !== 'APPROVED') {
      throw new Error('KYC not approved');
    }

    const plan = await tx.investmentPlan.findFirst({
      where: { id: planId, deleted_at: null }
    });
    if (!plan || !plan.is_active) {
      throw new Error('Plan not active');
    }

    if (amount.lt(plan.min_amount) || amount.gt(plan.max_amount)) {
      throw new Error('Amount out of plan range');
    }

    const wallets = await tx.wallet.findMany({
      where: { user_id: userId, type: 'MAIN', deleted_at: null }
    });

    if (wallets.length === 0) {
      throw new Error('Wallet not found');
    }

    const walletIds = wallets.map(w => w.id);
    const userMainAccounts = await tx.ledgerAccount.findMany({
      where: { user_id: userId, wallet_id: { in: walletIds }, deleted_at: null },
      select: { id: true, wallet_id: true },
      orderBy: { created_at: 'asc' }
    });

    if (userMainAccounts.length === 0) {
      throw new Error('Ledger accounts not configured');
    }
    const userMainAccountIds = userMainAccounts.map(a => a.id);

    const entries = await tx.ledgerEntry.groupBy({
      by: ['direction'],
      where: {
        ledger_account_id: { in: userMainAccountIds },
        deleted_at: null
      },
      _sum: { amount: true }
    });

    const debit = entries.find(e => e.direction === 'DEBIT')?._sum.amount ?? new Prisma.Decimal(0);
    const credit = entries.find(e => e.direction === 'CREDIT')?._sum.amount ?? new Prisma.Decimal(0);
    const balance = debit.minus(credit);

    if (balance.lt(amount)) {
      throw new Error('Insufficient balance');
    }

    const position = await tx.investmentPosition.create({
      data: {
        id: crypto.randomUUID(),
        user_id: userId,
        plan_id: planId,
        invested_amount: amount,
        start_date: new Date(),
        end_date: new Date(Date.now() + plan.duration_days * 24 * 60 * 60 * 1000),
        status: 'ACTIVE',
        total_profit_paid: new Prisma.Decimal(0)
      }
    });

    const userAccount = userMainAccounts[0];

    const systemInvestmentAccount = await tx.ledgerAccount.findFirst({
      where: { account_no: '3000', deleted_at: null },
      select: { id: true }
    });

    if (!userAccount || !systemInvestmentAccount) {
      throw new Error('Ledger accounts not configured');
    }

    const walletForTx = wallets.find(w => w.id === userAccount.wallet_id) ?? wallets[0];

    const transaction = await tx.transaction.create({
      data: {
        id: crypto.randomUUID(),
        user_id: userId,
        wallet_id: walletForTx.id,
        currency: walletForTx.currency,
        type: 'INVESTMENT',
        amount,
        status: 'SUCCESS',
        updated_at: new Date()
      }
    });

    await createDoubleEntryTransaction(tx, {
      debitAccountId: systemInvestmentAccount.id,
      creditAccountId: userAccount.id,
      amount,
      referenceId: transaction.id,
      userId
    });

    return position;
  });
}
