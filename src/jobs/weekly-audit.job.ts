import { prisma } from '@/database/prisma/client';
import { Prisma } from '@prisma/client';
import { getWalletBalance } from '@/services/wallet.service';
import { logFinancialAudit } from '@/services/financial-audit.service';
import { sendNotification } from '@/services/notification.service';

export async function runWeeklyAudit() {
  const wallets = await prisma.wallet.findMany({
    where: { deleted_at: null },
    select: { id: true, user_id: true, type: true }
  });

  const discrepancies: Array<{ walletId: string; userId: string; balance: string }> = [];

  for (const wallet of wallets) {
    const balance = await getWalletBalance(wallet.user_id, wallet.type);
    if (!balance.equals(new Prisma.Decimal(0))) {
      discrepancies.push({
        walletId: wallet.id,
        userId: wallet.user_id,
        balance: balance.toString()
      });
    }
  }

  if (discrepancies.length > 0) {
    await logFinancialAudit({
      action: 'WEEKLY_AUDIT_DISCREPANCY',
      metadata: { count: discrepancies.length, discrepancies }
    });

    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN', is_active: true },
      select: { id: true }
    });

    for (const admin of admins) {
      await sendNotification(
        admin.id,
        'WARNING',
        'Weekly Audit Discrepancies',
        `Found ${discrepancies.length} wallets with non-zero audit variance.`
      );
    }
  }
}
