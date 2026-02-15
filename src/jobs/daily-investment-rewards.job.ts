import { distributeDailyRewards } from '@/services/reward.service';
import { payoutReferralCommission } from '@/services/referral-payout.service';
import { logFinancialAudit } from '@/services/financial-audit.service';
import { prisma } from '@/database/prisma/client';
import { Prisma } from '@prisma/client';
import { calculateDailyRoi } from '@/services/roi.service';
import { sendNotification } from '@/services/notification.service';

export async function runDailyInvestmentRewards() {
  const positions = await prisma.investmentPosition.findMany({
    where: { status: 'ACTIVE' },
    include: { InvestmentPlan: true }
  });
  const userIds = [...new Set(positions.map(p => p.user_id))];
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  await distributeDailyRewards();

  for (const userId of userIds) {
    const alreadyAnnounced = await prisma.notification.findFirst({
      where: {
        user_id: userId,
        title: 'Daily profit announcement',
        created_at: { gte: startOfDay }
      },
      select: { id: true }
    });
    if (!alreadyAnnounced) {
      await sendNotification(
        userId,
        'INFO',
        'Daily profit announcement',
        'Today profit distribution cycle is running. Check your wallet and notifications for credited amounts.',
        { href: '/dashboard/notifications' }
      );
    }
  }

  for (const position of positions) {
    await payoutReferralCommission({
      userId: position.user_id,
      investmentAmount: new Prisma.Decimal(position.invested_amount),
      referenceId: position.id
    });

    const reward = calculateDailyRoi(position as any, position.InvestmentPlan as any);
    if (reward.gt(new Prisma.Decimal(0))) {
      await sendNotification(
        position.user_id,
        'SUCCESS',
        'Profit Credited',
        `Daily profit credited: ${reward.toString()}.`,
        { href: '/dashboard/notifications' }
      );
    }
  }

  await logFinancialAudit({
    action: 'DAILY_REWARD_DISTRIBUTION',
    metadata: { count: positions.length }
  });
}
