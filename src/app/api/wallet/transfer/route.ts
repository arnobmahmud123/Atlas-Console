import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/modules/auth/services/auth-options';
import { processWalletTransfer } from '@/services/transfer.service';
import { Prisma } from '@prisma/client';
import { zDecimalString, zSanitizedString } from '@/lib/http/sanitize';

const schema = z.object({
  toUserId: zSanitizedString().uuid(),
  amount: zDecimalString()
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, errors: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const result = await processWalletTransfer({
    fromUserId: session.user.id,
    toUserId: parsed.data.toUserId,
    amount: new Prisma.Decimal(parsed.data.amount)
  });

  return NextResponse.json({ ok: true, transaction: result });
}
