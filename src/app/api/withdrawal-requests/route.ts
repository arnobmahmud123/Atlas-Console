import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { authOptions } from '@/modules/auth/services/auth-options';
import { zDecimalString, zSanitizedString } from '@/lib/http/sanitize';
import { prisma } from '@/database/prisma/client';
import { createManualMobileWithdrawalRequest } from '@/services/manual-mobile-withdrawal-request.service';

const createSchema = z.object({
  method: z.enum(['BKASH', 'NAGAD']),
  amount: zDecimalString(),
  payoutNumber: zSanitizedString().min(6).max(32),
  otp: z.string().regex(/^\d{6}$/).optional()
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ ok: false }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, errors: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const result = await createManualMobileWithdrawalRequest({
    userId: session.user.id,
    method: parsed.data.method,
    amount: new Prisma.Decimal(parsed.data.amount),
    payoutNumber: parsed.data.payoutNumber,
    dailyLimit: new Prisma.Decimal('1000'),
    otp: parsed.data.otp
  });

  return NextResponse.json(
    result.ok
      ? { ok: true, requestId: result.requestId, message: 'Withdrawal request submitted for review.' }
      : { ok: false, message: result.message, requiresOtp: (result as any).requiresOtp ?? false },
    { status: result.ok ? 200 : 400 }
  );
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ ok: false }, { status: 401 });

  const data = await prisma.withdrawalRequest.findMany({
    where: { user_id: session.user.id },
    orderBy: { created_at: 'desc' },
    take: 50
  });
  return NextResponse.json({ ok: true, data });
}

