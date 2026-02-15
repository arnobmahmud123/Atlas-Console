import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { authOptions } from '@/modules/auth/services/auth-options';
import { prisma } from '@/database/prisma/client';
import { createDoubleEntryTransaction } from '@/services/ledger.service';
import { zDecimalString, zSanitizedString } from '@/lib/http/sanitize';
import crypto from 'crypto';

const bodySchema = z.object({
  debitAccountId: zSanitizedString().uuid(),
  creditAccountId: zSanitizedString().uuid(),
  amount: zDecimalString(),
  referenceId: zSanitizedString().min(1)
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return NextResponse.json({ ok: false, message: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, errors: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  try {
    const now = new Date();
    const result = await prisma.$transaction(async tx => {
      const debitAccount = await tx.ledgerAccount.findUnique({
        where: { id: parsed.data.debitAccountId },
        include: { Wallet: { select: { currency: true } } }
      });

      if (!debitAccount) {
        throw new Error('Debit account not found');
      }

      const transaction = await tx.transaction.create({
        data: {
          id: crypto.randomUUID(),
          user_id: debitAccount.user_id,
          wallet_id: debitAccount.wallet_id,
          currency: debitAccount.Wallet?.currency ?? 'USD',
          type: 'TRANSFER',
          amount: new Prisma.Decimal(parsed.data.amount),
          status: 'SUCCESS',
          reference: `wallet_adjust:${crypto.randomUUID().slice(0, 8)}`,
          updated_at: now
        }
      });

      await createDoubleEntryTransaction(tx, {
        debitAccountId: parsed.data.debitAccountId,
        creditAccountId: parsed.data.creditAccountId,
        amount: new Prisma.Decimal(parsed.data.amount),
        referenceId: transaction.id,
        userId: debitAccount.user_id
      });

      return transaction.id;
    });

    return NextResponse.json({ ok: true, transactionId: result, message: 'Adjustment posted.' });
  } catch (e: any) {
    return NextResponse.json({ ok: false, message: e?.message ?? 'Failed to post adjustment' }, { status: 400 });
  }
}
