import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { authOptions } from '@/modules/auth/services/auth-options';
import { createDoubleEntryTransaction } from '@/services/ledger.service';
import { prisma } from '@/database/prisma/client';
import { zDecimalString, zSanitizedString } from '@/lib/http/sanitize';
import crypto from 'crypto';

const bodySchema = z.object({
  amount: zDecimalString(),
  debitAccountId: zSanitizedString().uuid(),
  creditAccountId: zSanitizedString().uuid(),
  referenceId: zSanitizedString().min(1)
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return NextResponse.json({ ok: false, message: 'Forbidden' }, { status: 403 });
  }

  const paramParsed = zSanitizedString().uuid().safeParse(id);
  if (!paramParsed.success) {
    return NextResponse.json({ ok: false, errors: { id: ['Invalid user id'] } }, { status: 400 });
  }

  const body = await request.json();
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, errors: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  try {
    const now = new Date();
    const out = await prisma.$transaction(async tx => {
      const [debitAccount, creditAccount] = await Promise.all([
        tx.ledgerAccount.findUnique({
          where: { id: parsed.data.debitAccountId },
          include: { Wallet: { select: { currency: true } } }
        }),
        tx.ledgerAccount.findUnique({
          where: { id: parsed.data.creditAccountId },
          include: { Wallet: { select: { currency: true } } }
        })
      ]);

      if (!debitAccount) throw new Error('Debit account not found');
      if (!creditAccount) throw new Error('Credit account not found');

      const userSide =
        debitAccount.user_id === id ? debitAccount : creditAccount.user_id === id ? creditAccount : null;
      if (!userSide) {
        throw new Error('One of the selected accounts must belong to the target user.');
      }

      const reference = `${parsed.data.referenceId}:${crypto.randomUUID().slice(0, 8)}`;
      const transaction = await tx.transaction.create({
        data: {
          id: crypto.randomUUID(),
          user_id: id,
          wallet_id: userSide.wallet_id,
          currency: userSide.Wallet?.currency ?? 'USD',
          type: 'TRANSFER',
          amount: new Prisma.Decimal(parsed.data.amount),
          status: 'SUCCESS',
          reference,
          updated_at: now
        }
      });

      await createDoubleEntryTransaction(tx, {
        debitAccountId: parsed.data.debitAccountId,
        creditAccountId: parsed.data.creditAccountId,
        amount: new Prisma.Decimal(parsed.data.amount),
        referenceId: transaction.id,
        userId: id
      });

      return { transactionId: transaction.id, reference };
    });

    return NextResponse.json({ ok: true, message: 'Adjustment posted.', ...out });
  } catch (e: any) {
    return NextResponse.json({ ok: false, message: e?.message ?? 'Failed to post adjustment' }, { status: 400 });
  }
}
