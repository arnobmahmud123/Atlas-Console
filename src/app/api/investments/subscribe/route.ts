import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { authOptions } from '@/modules/auth/services/auth-options';
import { createInvestmentPosition } from '@/services/investment.service';
import { sanitizeString, zDecimalString } from '@/lib/http/sanitize';
import { getWalletBalance } from '@/services/wallet.service';

const schema = z.object({
  planId: z.preprocess(sanitizeString, z.string().uuid()),
  amount: zDecimalString(),
  acceptTerms: z.literal(true)
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ ok: false, message: 'Invalid request body' }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, errors: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const amount = new Prisma.Decimal(parsed.data.amount);
  if (amount.lte(0)) {
    return NextResponse.json({ ok: false, message: 'Amount must be greater than 0' }, { status: 400 });
  }

  try {
    const position = await createInvestmentPosition(session.user.id, parsed.data.planId, amount);
    const mainBalance = await getWalletBalance(session.user.id, 'MAIN');
    return NextResponse.json({ ok: true, position, mainBalance: mainBalance.toString() });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : 'Failed to subscribe' },
      { status: 400 }
    );
  }
}
