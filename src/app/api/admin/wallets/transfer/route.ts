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
  fromAccountId: zSanitizedString().uuid(),
  toAccountId: zSanitizedString().uuid(),
  amount: zDecimalString(),
  note: zSanitizedString().optional()
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  const body = await request.json();
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, errors: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const result = await prisma.$transaction(async tx => {
    const fromAccount = await tx.ledgerAccount.findUnique({
      where: { id: parsed.data.fromAccountId },
      include: { Wallet: { select: { currency: true } } }
    });

    if (!fromAccount) {
      throw new Error('From account not found');
    }

    const transaction = await tx.transaction.create({
      data: {
        id: crypto.randomUUID(),
        user_id: fromAccount.user_id,
        wallet_id: fromAccount.wallet_id,
        currency: fromAccount.Wallet?.currency ?? 'USD',
        type: 'TRANSFER',
        amount: new Prisma.Decimal(parsed.data.amount),
        status: 'SUCCESS',
        updated_at: new Date()
      }
    });

    await createDoubleEntryTransaction(tx, {
      debitAccountId: parsed.data.fromAccountId,
      creditAccountId: parsed.data.toAccountId,
      amount: new Prisma.Decimal(parsed.data.amount),
      referenceId: transaction.id,
      userId: fromAccount.user_id
    });

    return transaction.id;
  });

  return NextResponse.json({ ok: true, transactionId: result });
}
