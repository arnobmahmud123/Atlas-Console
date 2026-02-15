import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { authOptions } from '@/modules/auth/services/auth-options';
import { createWithdrawalRequest } from '@/services/withdrawal-request.service';
import { zDecimalString } from '@/lib/http/sanitize';
import { prisma } from '@/database/prisma/client';

const schema = z.object({
  amount: zDecimalString(),
  withdrawMethod: z.enum(['BANK', 'CRYPTO', 'MANUAL', 'MOBILE_BANKING']),
  otp: z.string().min(6).max(6).optional()
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

  if (new Prisma.Decimal(parsed.data.amount).lte(0)) {
    return NextResponse.json({ ok: false, message: 'Amount must be greater than 0' }, { status: 400 });
  }

  const result = await createWithdrawalRequest({
    userId: session.user.id,
    amount: new Prisma.Decimal(parsed.data.amount),
    withdrawMethod: parsed.data.withdrawMethod,
    dailyLimit: new Prisma.Decimal('1000'),
    otp: parsed.data.otp
  });

  if (result.ok) {
    return NextResponse.json(result, { status: 200 });
  }

  return NextResponse.json(
    { ...result, message: result.errors?.[0] ?? 'Withdrawal request failed' },
    { status: 400 }
  );
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const withdrawals = await prisma.withdrawal.findMany({
    where: { user_id: session.user.id },
    orderBy: { created_at: 'desc' },
    take: 20
  });

  return NextResponse.json({ ok: true, data: withdrawals });
}
