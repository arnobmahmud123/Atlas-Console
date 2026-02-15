import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { Prisma } from '@prisma/client';
import crypto from 'crypto';
import { authOptions } from '@/modules/auth/services/auth-options';
import { prisma } from '@/database/prisma/client';
import { createDoubleEntryTransaction } from '@/services/ledger.service';
import { getOrCreateUserMainLedgerAccount, getSystemLedgerAccountByNo, getUserMainBalanceTx } from '@/services/ledger-accounts.service';
import { logAudit } from '@/modules/auth/services/audit.service';

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ ok: false }, { status: 401 });
  if (session.user.role !== 'ADMIN') return NextResponse.json({ ok: false }, { status: 403 });

  try {
    const out = await prisma.$transaction(async tx => {
      const req = await tx.withdrawalRequest.findUnique({ where: { id } });
      if (!req) throw new Error('Withdrawal request not found');
      if (req.status !== 'PENDING_ADMIN_FINAL') throw new Error('Not ready for admin final approval');

      const systemLiability = await getSystemLedgerAccountByNo(tx, '2000');
      if (!systemLiability) throw new Error('System ledger account 2000 missing');
      const userMain = await getOrCreateUserMainLedgerAccount(tx, req.user_id);

      const balance = await getUserMainBalanceTx(tx, req.user_id);
      if (balance.lt(req.amount)) throw new Error('Insufficient balance');

      const now = new Date();
      const transaction = await tx.transaction.create({
        data: {
          id: crypto.randomUUID(),
          user_id: req.user_id,
          wallet_id: userMain.wallet_id,
          type: 'WITHDRAWAL',
          amount: req.amount,
          currency: 'USD',
          status: 'SUCCESS',
          reference: `manual_withdrawal:${req.id}`,
          updated_at: now
        }
      });

      // Reduce user balance on final approval.
      await createDoubleEntryTransaction(tx, {
        debitAccountId: systemLiability.id,
        creditAccountId: userMain.id,
        amount: new Prisma.Decimal(req.amount),
        referenceId: transaction.id,
        userId: req.user_id
      });

      await tx.withdrawalRequest.update({
        where: { id: req.id },
        data: { status: 'APPROVED', finalized_by_admin_id: session.user.id, updated_at: now }
      });

      return { requestId: req.id, transactionId: transaction.id };
    });

    await logAudit({
      userId: session.user.id,
      action: 'FINAL_APPROVE',
      resource: 'withdrawal_request',
      metadata: { requestId: out.requestId, transactionId: out.transactionId }
    });

    return NextResponse.json({ ok: true, message: 'Withdrawal approved and posted to ledger.' });
  } catch (e: any) {
    return NextResponse.json({ ok: false, message: e?.message ?? 'Failed' }, { status: 400 });
  }
}
