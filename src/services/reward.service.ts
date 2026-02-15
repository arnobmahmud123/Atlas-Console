import { prisma } from '@/database/prisma/client';
import { Prisma } from '@prisma/client';
import crypto from 'crypto';
import { calculateDailyRoi } from '@/services/roi.service';
import { createDoubleEntryTransaction } from '@/services/ledger.service';
import { sendEmail, emailInvestmentReward } from '@/services/email.service';

export async function distributeDailyRewards() {
  const positions = await prisma.investmentPosition.findMany({
    where: { status: 'ACTIVE' },
    include: { InvestmentPlan: true }
  });

  const batchSize = 50;

  for (let i = 0; i < positions.length; i += batchSize) {
    const batch = positions.slice(i, i + batchSize);

    await prisma.$transaction(async tx => {
      for (const position of batch) {
        const reward = calculateDailyRoi(position, position.InvestmentPlan);
        if (reward.lte(new Prisma.Decimal(0))) continue;

        const userAccount = await tx.ledgerAccount.findFirst({
          where: { user_id: position.user_id, deleted_at: null },
          select: { id: true }
        });

        const rewardAccount = await tx.ledgerAccount.findFirst({
          where: { account_no: '4000', deleted_at: null },
          select: { id: true }
        });

        if (!userAccount || !rewardAccount) {
          throw new Error('Ledger accounts not configured');
        }

        const wallet = await tx.wallet.findFirst({
          where: { user_id: position.user_id, type: 'MAIN', deleted_at: null }
        });

        if (!wallet) {
          throw new Error('Wallet not found');
        }

        const transaction = await tx.transaction.create({
          data: {
            id: crypto.randomUUID(),
            user_id: position.user_id,
            wallet_id: wallet.id,
            currency: wallet.currency,
            type: 'DIVIDEND',
            amount: reward,
            status: 'SUCCESS',
            updated_at: new Date()
          }
        });

        await createDoubleEntryTransaction(tx, {
          debitAccountId: rewardAccount.id,
          creditAccountId: userAccount.id,
          amount: reward,
          referenceId: transaction.id,
          userId: position.user_id
        });

        await tx.investmentPosition.update({
          where: { id: position.id },
          data: { total_profit_paid: position.total_profit_paid.plus(reward) }
        });

        const user = await tx.user.findUnique({
          where: { id: position.user_id },
          select: { email: true }
        });
        if (user?.email) {
          const tmpl = emailInvestmentReward(reward.toString());
          await sendEmail({ to: user.email, ...tmpl });
        }
      }
    });
  }
}
