import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { authOptions } from '@/modules/auth/services/auth-options';
import { prisma } from '@/database/prisma/client';
import { zDecimalString, zIntString, zSanitizedString } from '@/lib/http/sanitize';
import crypto from 'crypto';

const planSchema = z.object({
  name: zSanitizedString().min(2),
  min_amount: zDecimalString(),
  max_amount: zDecimalString(),
  roi_type: z.enum(['FIXED', 'VARIABLE', 'ADMIN_MANUAL']),
  roi_value: zDecimalString(),
  duration_days: zIntString(),
  is_active: z.boolean().optional()
}).superRefine((val, ctx) => {
  const min = new Prisma.Decimal(val.min_amount);
  const max = new Prisma.Decimal(val.max_amount);
  if (min.gt(max)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Min amount must be <= max amount', path: ['min_amount'] });
  }
  const roi = new Prisma.Decimal(val.roi_value);
  if ((val.roi_type === 'FIXED' || val.roi_type === 'VARIABLE') && roi.lte(new Prisma.Decimal(0))) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'ROI must be > 0 for FIXED/VARIABLE', path: ['roi_value'] });
  }
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return NextResponse.json({ ok: false, message: 'Forbidden' }, { status: 403 });
  }

  const plans = await prisma.investmentPlan.findMany({
    where: { deleted_at: null },
    orderBy: { created_at: 'desc' }
  });

  return NextResponse.json({ ok: true, data: plans });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return NextResponse.json({ ok: false, message: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const parsed = planSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, errors: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  try {
    const plan = await prisma.investmentPlan.create({
      data: {
        id: crypto.randomUUID(),
        name: parsed.data.name,
        min_amount: new Prisma.Decimal(parsed.data.min_amount),
        max_amount: new Prisma.Decimal(parsed.data.max_amount),
        roi_type: parsed.data.roi_type,
        roi_value: new Prisma.Decimal(parsed.data.roi_value),
        duration_days: Number(parsed.data.duration_days),
        is_active: parsed.data.is_active ?? true,
        deleted_at: null
      }
    });

    return NextResponse.json({ ok: true, plan });
  } catch (e: any) {
    // Most common: unique name conflict.
    const msg =
      typeof e?.message === 'string' && e.message.includes('Unique constraint')
        ? 'Plan name already exists.'
        : e?.message ?? 'Failed to create plan.';
    return NextResponse.json({ ok: false, message: msg }, { status: 400 });
  }
}
