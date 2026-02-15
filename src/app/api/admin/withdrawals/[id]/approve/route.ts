import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/modules/auth/services/auth-options';
import { prisma } from '@/database/prisma/client';
import { approveWithdrawal } from '@/services/withdrawal-review.service';
import { sanitizeString } from '@/lib/http/sanitize';

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  const parsed = z.preprocess(sanitizeString, z.string().uuid()).safeParse(id);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, errors: { id: ['Invalid withdrawal id'] } }, { status: 400 });
  }

  const withdrawal = await prisma.withdrawal.findUnique({ where: { id } });
  if (!withdrawal) {
    return NextResponse.json({ ok: false, error: 'Withdrawal not found' }, { status: 404 });
  }

  const userAccount = await prisma.ledgerAccount.findFirst({
    where: {
      user_id: withdrawal.user_id,
      deleted_at: null,
      Wallet: { is: { type: 'MAIN', deleted_at: null } }
    },
    orderBy: { created_at: 'asc' },
    select: { id: true }
  });

  const cashAccount = await prisma.ledgerAccount.findFirst({
    where: { account_no: '1000', deleted_at: null },
    select: { id: true }
  });

  if (!userAccount || !cashAccount) {
    return NextResponse.json({ ok: false, error: 'Ledger accounts not configured' }, { status: 400 });
  }

  const result = await approveWithdrawal({
    withdrawalId: withdrawal.id,
    reviewedBy: session.user.id,
    // Withdrawal reduces user balance:
    // credit user (increases credit), debit cash/outflow account.
    debitAccountId: cashAccount.id,
    creditAccountId: userAccount.id
  });

  return NextResponse.json({ ok: true, message: 'Withdrawal approved', withdrawal: result });
}
