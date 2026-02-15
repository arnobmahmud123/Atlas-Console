import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import crypto from 'crypto';
import { authOptions } from '@/modules/auth/services/auth-options';
import { prisma } from '@/database/prisma/client';
import { zSanitizedString } from '@/lib/http/sanitize';

const updateSchema = z.object({
  accountType: z.enum(['BANK', 'CRYPTO', 'MANUAL', 'MOBILE_BANKING']),
  mobileProvider: z.enum(['BKASH', 'NAGAD']).optional(),
  accountNumber: zSanitizedString().min(6).max(32)
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ ok: false }, { status: 401 });

  try {
    const record = await prisma.payoutAccount.findUnique({
      where: { user_id: session.user.id },
      select: { account_type: true, mobile_provider: true, account_number: true, updated_at: true }
    });
    return NextResponse.json({ ok: true, payoutAccount: record });
  } catch (e: any) {
    const msg =
      e?.code === 'P2021'
        ? 'PayoutAccount table missing. Run `npx prisma migrate dev` then reload.'
        : 'Failed to load payout account';
    return NextResponse.json({ ok: false, message: msg }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ ok: false }, { status: 401 });

  try {
    const body = await request.json().catch(() => null);
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ ok: false, errors: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    if (parsed.data.accountType === 'MOBILE_BANKING' && !parsed.data.mobileProvider) {
      return NextResponse.json(
        { ok: false, errors: { mobileProvider: ['Select Bkash or Nagad'] } },
        { status: 400 }
      );
    }

    const now = new Date();
    const record = await prisma.payoutAccount.upsert({
      where: { user_id: session.user.id },
      update: {
        account_type: parsed.data.accountType,
        mobile_provider: parsed.data.accountType === 'MOBILE_BANKING' ? parsed.data.mobileProvider : null,
        account_number: parsed.data.accountNumber,
        updated_at: now,
        deleted_at: null
      },
      create: {
        id: crypto.randomUUID(),
        user_id: session.user.id,
        account_type: parsed.data.accountType,
        mobile_provider: parsed.data.accountType === 'MOBILE_BANKING' ? parsed.data.mobileProvider : null,
        account_number: parsed.data.accountNumber,
        updated_at: now
      }
    });

    return NextResponse.json({ ok: true, payoutAccount: record, message: 'Payment method saved' });
  } catch (e: any) {
    const msg =
      e?.code === 'P2021'
        ? 'PayoutAccount table missing. Run `npx prisma migrate dev` then reload.'
        : e?.message ?? 'Failed to save payout account';
    return NextResponse.json({ ok: false, message: msg }, { status: 500 });
  }
}
