import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { Prisma } from '@prisma/client';
import { authOptions } from '@/modules/auth/services/auth-options';
import { prisma } from '@/database/prisma/client';
import { createDoubleEntryTransaction } from '@/services/ledger.service';
import { getOrCreateUserMainLedgerAccount, getSystemLedgerAccountByNo } from '@/services/ledger-accounts.service';
import { logAudit } from '@/modules/auth/services/audit.service';
import { sendNotification } from '@/services/notification.service';
import crypto from 'crypto';

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ ok: false }, { status: 401 });
  if (session.user.role !== 'ADMIN') return NextResponse.json({ ok: false }, { status: 403 });

  try {
    const out = await prisma.$transaction(async tx => {
      const req = await tx.depositRequest.findUnique({ where: { id } });
      if (!req) throw new Error('Deposit request not found');
      if (req.status !== 'PENDING_ADMIN_FINAL') throw new Error('Not ready for admin final approval');

      const systemLiability = await getSystemLedgerAccountByNo(tx, '2000');
      if (!systemLiability) throw new Error('System ledger account 2000 missing');
      const userMain = await getOrCreateUserMainLedgerAccount(tx, req.user_id);

      const now = new Date();
      const transaction = await tx.transaction.create({
        data: {
          id: crypto.randomUUID(),
          user_id: req.user_id,
          wallet_id: userMain.wallet_id,
          type: 'DEPOSIT',
          amount: req.amount,
          currency: 'USD',
          status: 'SUCCESS',
          reference: `manual_deposit:${req.id}`,
          updated_at: now
        }
      });

      await createDoubleEntryTransaction(tx, {
        debitAccountId: userMain.id,
        creditAccountId: systemLiability.id,
        amount: new Prisma.Decimal(req.amount),
        referenceId: transaction.id,
        userId: req.user_id
      });

      await tx.depositRequest.update({
        where: { id: req.id },
        data: { status: 'APPROVED', finalized_by_admin_id: session.user.id, updated_at: now }
      });

      return { requestId: req.id, transactionId: transaction.id, userId: req.user_id, amount: req.amount.toString() };
    });

    await logAudit({
      userId: session.user.id,
      action: 'FINAL_APPROVE',
      resource: 'deposit_request',
      metadata: { requestId: out.requestId, transactionId: out.transactionId }
    });

    await sendNotification(
      out.userId,
      'SUCCESS',
      'Deposit Approved',
      `Your deposit request ${out.requestId} has been fully approved and credited to your main wallet (+$${out.amount}).`,
      { href: '/dashboard/wallets' }
    ).catch(() => null);

    return NextResponse.json({ ok: true, message: 'Deposit approved and credited.' });
  } catch (e: any) {
    return NextResponse.json({ ok: false, message: e?.message ?? 'Failed' }, { status: 400 });
  }
}
