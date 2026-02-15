import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { authOptions } from '@/modules/auth/services/auth-options';
import { zDecimalString, zSanitizedString } from '@/lib/http/sanitize';
import { prisma } from '@/database/prisma/client';
import { createManualMobileDepositRequest } from '@/services/manual-mobile-deposit-request.service';

const createSchema = z.object({
  method: z.enum(['BKASH', 'NAGAD']),
  amount: zDecimalString(),
  transactionId: zSanitizedString().min(4).max(64),
  receiptFileUrl: zSanitizedString().url().optional()
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ ok: false }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, errors: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const result = await createManualMobileDepositRequest({
    userId: session.user.id,
    method: parsed.data.method,
    amount: new Prisma.Decimal(parsed.data.amount),
    transactionId: parsed.data.transactionId,
    receiptFileUrl: parsed.data.receiptFileUrl ?? null
  });

  return NextResponse.json(
    result.ok ? { ok: true, requestId: result.requestId, message: 'Deposit request submitted for review.' } : result,
    { status: result.ok ? 200 : 400 }
  );
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ ok: false }, { status: 401 });

  const data = await prisma.depositRequest.findMany({
    where: { user_id: session.user.id },
    orderBy: { created_at: 'desc' },
    take: 50
  });
  return NextResponse.json({ ok: true, data });
}

