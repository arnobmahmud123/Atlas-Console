import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { authOptions } from '@/modules/auth/services/auth-options';
import { prisma } from '@/database/prisma/client';
import { createDoubleEntryTransaction } from '@/services/ledger.service';
import { sanitizeString } from '@/lib/http/sanitize';
import crypto from 'crypto';

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  const parsed = z.preprocess(sanitizeString, z.string().uuid()).safeParse(id);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, errors: { id: ['Invalid deposit id'] } }, { status: 400 });
  }

  try {
    const result = await prisma.$transaction(async tx => {
      const deposit = await tx.deposit.findUnique({ where: { id } });
      if (!deposit) throw new Error('Deposit not found');
      if (deposit.status === 'SUCCESS') return deposit;

      const cashAccount = await tx.ledgerAccount.findFirst({
        where: { account_no: '1000', deleted_at: null },
        select: { id: true }
      });

      const wallet = await tx.wallet.findFirst({
        where: { user_id: deposit.user_id, type: 'MAIN', deleted_at: null }
      });

      if (!wallet) throw new Error('Wallet not found');

      if (!cashAccount) throw new Error('Ledger accounts not configured');

      const userAccount = await tx.ledgerAccount.findFirst({
        where: {
          user_id: deposit.user_id,
          wallet_id: wallet.id,
          deleted_at: null,
          id: { not: cashAccount.id }
        },
        orderBy: { created_at: 'asc' },
        select: { id: true }
      });

      if (!userAccount) {
        throw new Error('User ledger account not configured');
      }

      const transaction = await tx.transaction.create({
        data: {
          id: crypto.randomUUID(),
          user_id: deposit.user_id,
          wallet_id: wallet.id,
          currency: wallet.currency,
          type: 'DEPOSIT',
          amount: new Prisma.Decimal(deposit.amount),
          status: 'SUCCESS',
          reference: deposit.id,
          updated_at: new Date()
        }
      });

      await createDoubleEntryTransaction(tx, {
        debitAccountId: userAccount.id,
        creditAccountId: cashAccount.id,
        amount: new Prisma.Decimal(deposit.amount),
        referenceId: transaction.id,
        userId: deposit.user_id
      });

      return tx.deposit.update({
        where: { id: deposit.id },
        data: { status: 'SUCCESS', updated_at: new Date() }
      });
    });

    return NextResponse.json({ ok: true, deposit: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to approve deposit';
    const status =
      message === 'Deposit not found' ||
      message === 'Ledger accounts not configured' ||
      message === 'User ledger account not configured' ||
      message === 'Wallet not found'
        ? 400
        : 500;
    return NextResponse.json({ ok: false, message }, { status });
  }
}
