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
  amount: zDecimalString()
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  const idParsed = zSanitizedString().uuid().safeParse(id);
  if (!idParsed.success) {
    return NextResponse.json({ ok: false, errors: { id: ['Invalid investment id'] } }, { status: 400 });
  }

  let raw: unknown = {};
  const contentType = request.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    raw = await request.json();
  } else {
    const form = await request.formData();
    raw = { amount: form.get('amount') };
  }

  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, errors: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const result = await prisma.$transaction(async tx => {
    const investment = await tx.investmentPosition.findUnique({ where: { id } });
    if (!investment) throw new Error('Investment not found');

    const userAccount = await tx.ledgerAccount.findFirst({
      where: { user_id: investment.user_id, deleted_at: null },
      select: { id: true }
    });

    const rewardAccount = await tx.ledgerAccount.findFirst({
      where: { account_no: '4000', deleted_at: null },
      select: { id: true }
    });

    if (!userAccount || !rewardAccount) throw new Error('Ledger accounts not configured');

    const wallet = await tx.wallet.findFirst({
      where: { user_id: investment.user_id, type: 'MAIN', deleted_at: null }
    });

    if (!wallet) throw new Error('Wallet not found');

    const now = new Date();
    const transaction = await tx.transaction.create({
      data: {
        id: crypto.randomUUID(),
        user_id: investment.user_id,
        wallet_id: wallet.id,
        currency: wallet.currency,
        type: 'DIVIDEND',
        amount: new Prisma.Decimal(parsed.data.amount),
        status: 'SUCCESS',
        reference: `manual_profit:${investment.id}:${crypto.randomUUID().slice(0, 8)}`,
        updated_at: now
      }
    });

    await createDoubleEntryTransaction(tx, {
      debitAccountId: rewardAccount.id,
      creditAccountId: userAccount.id,
      amount: new Prisma.Decimal(parsed.data.amount),
      referenceId: transaction.id,
      userId: investment.user_id
    });

    await tx.investmentPosition.update({
      where: { id: investment.id },
      data: { total_profit_paid: investment.total_profit_paid.plus(new Prisma.Decimal(parsed.data.amount)) }
    });

    return { transactionId: transaction.id };
  });

  return NextResponse.json({ ok: true, ...result });
}
