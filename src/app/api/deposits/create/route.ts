import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { authOptions } from '@/modules/auth/services/auth-options';
import { createDepositRequest } from '@/services/deposit-request.service';
import { zDecimalString } from '@/lib/http/sanitize';
import { prisma } from '@/database/prisma/client';

const schema = z.object({
  amount: zDecimalString(),
  paymentMethod: z.enum(['STRIPE', 'CRYPTO', 'MANUAL', 'BANK'])
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
    const result = await createDepositRequest(session.user.id, amount, parsed.data.paymentMethod);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error instanceof Error ? error.message : 'Failed to create deposit' },
      { status: 500 }
    );
  }
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const deposits = await prisma.deposit.findMany({
    where: { user_id: session.user.id },
    orderBy: { created_at: 'desc' },
    take: 20
  });

  return NextResponse.json({ ok: true, data: deposits });
}
