import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/modules/auth/services/auth-options';
import { prisma } from '@/database/prisma/client';
import { getPrismaMigrationMessage } from '@/lib/http/prisma-errors';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });

  const url = new URL(request.url);
  const limit = Math.max(1, Math.min(30, Number(url.searchParams.get('limit') ?? 12)));

  const role = (session.user as any)?.role as string | undefined;

  try {
    const [data, unreadCount, pendingAcctDeposits, pendingAcctWithdrawals, pendingAdminFinalDeposits, pendingAdminFinalWithdrawals, pendingKyc, pendingProfitBatches] =
      await Promise.all([
        prisma.notification.findMany({
          where: { user_id: session.user.id },
          orderBy: { created_at: 'desc' },
          take: limit
        }),
        prisma.notification.count({ where: { user_id: session.user.id, read: false } }),
        role === 'ACCOUNTANT'
          ? prisma.depositRequest.count({ where: { status: 'PENDING_ACCOUNTANT' } })
          : Promise.resolve(0),
        role === 'ACCOUNTANT'
          ? prisma.withdrawalRequest.count({ where: { status: 'PENDING_ACCOUNTANT' } })
          : Promise.resolve(0),
        role === 'ADMIN'
          ? prisma.depositRequest.count({ where: { status: 'PENDING_ADMIN_FINAL' } })
          : Promise.resolve(0),
        role === 'ADMIN'
          ? prisma.withdrawalRequest.count({ where: { status: 'PENDING_ADMIN_FINAL' } })
          : Promise.resolve(0),
        role === 'ADMIN' ? prisma.kyc.count({ where: { status: 'PENDING' } }) : Promise.resolve(0),
        role === 'ADMIN' ? prisma.profitBatch.count({ where: { status: 'PENDING_ADMIN_FINAL' } }) : Promise.resolve(0)
      ]);

    const system: Array<{
      id: string;
      type: 'INFO' | 'WARNING' | 'SUCCESS' | 'ERROR';
      title: string;
      message: string;
      read: boolean;
      created_at: string;
      href?: string;
      system?: boolean;
    }> = [];

    const nowIso = new Date().toISOString();

    if (role === 'ACCOUNTANT') {
      if (pendingAcctDeposits > 0) {
        system.push({
          id: 'system:acct:pending-deposits',
          type: 'WARNING',
          title: `${pendingAcctDeposits} pending manual deposit${pendingAcctDeposits === 1 ? '' : 's'}`,
          message: 'Review required: user mobile banking deposits awaiting accountant approval.',
          read: false,
          created_at: nowIso,
          href: '/accountant/deposits',
          system: true
        });
      }
      if (pendingAcctWithdrawals > 0) {
        system.push({
          id: 'system:acct:pending-withdrawals',
          type: 'WARNING',
          title: `${pendingAcctWithdrawals} pending manual withdrawal${pendingAcctWithdrawals === 1 ? '' : 's'}`,
          message: 'Review required: user withdrawal requests awaiting accountant review.',
          read: false,
          created_at: nowIso,
          href: '/accountant/withdrawals',
          system: true
        });
      }
    }

    if (role === 'ADMIN') {
      if (pendingAdminFinalDeposits > 0) {
        system.push({
          id: 'system:admin:pending-deposits-final',
          type: 'WARNING',
          title: `${pendingAdminFinalDeposits} manual deposit${pendingAdminFinalDeposits === 1 ? '' : 's'} awaiting final approval`,
          message: 'Finalize approvals to credit wallets via ledger.',
          read: false,
          created_at: nowIso,
          href: '/admin/manual-approvals/deposits',
          system: true
        });
      }
      if (pendingAdminFinalWithdrawals > 0) {
        system.push({
          id: 'system:admin:pending-withdrawals-final',
          type: 'WARNING',
          title: `${pendingAdminFinalWithdrawals} manual withdrawal${pendingAdminFinalWithdrawals === 1 ? '' : 's'} awaiting final approval`,
          message: 'Finalize approvals to post withdrawal ledger entries.',
          read: false,
          created_at: nowIso,
          href: '/admin/manual-approvals/withdrawals',
          system: true
        });
      }
      if (pendingKyc > 0) {
        system.push({
          id: 'system:admin:pending-kyc',
          type: 'INFO',
          title: `${pendingKyc} KYC request${pendingKyc === 1 ? '' : 's'} pending`,
          message: 'Approve or reject KYC to unlock deposits/withdrawals.',
          read: false,
          created_at: nowIso,
          href: '/admin/kyc/pending',
          system: true
        });
      }
      if (pendingProfitBatches > 0) {
        system.push({
          id: 'system:admin:pending-profit-batches',
          type: 'WARNING',
          title: `${pendingProfitBatches} profit batch${pendingProfitBatches === 1 ? '' : 'es'} pending final approval`,
          message: 'Accountant-submitted profit batches require final approval.',
          read: false,
          created_at: nowIso,
          href: '/admin/profits/approvals',
          system: true
        });
      }
    }

    const combined = [...system, ...data].slice(0, limit);
    const combinedUnread = unreadCount + system.length;

    return NextResponse.json({ ok: true, data: combined, unreadCount: combinedUnread });
  } catch (e: any) {
    const mapped = getPrismaMigrationMessage(e, 'Failed to load notifications');
    return NextResponse.json({ ok: false, message: mapped.message }, { status: mapped.status });
  }
}
