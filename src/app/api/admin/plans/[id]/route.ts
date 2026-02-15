import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { authOptions } from '@/modules/auth/services/auth-options';
import { prisma } from '@/database/prisma/client';
import { zDecimalString, zIntString, zSanitizedString } from '@/lib/http/sanitize';

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

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  const plan = await prisma.investmentPlan.findFirst({
    where: { id, deleted_at: null }
  });
  return NextResponse.json({ ok: true, plan });
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  const body = await request.json();
  const parsed = planSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, errors: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const plan = await prisma.investmentPlan.update({
    where: { id },
    data: {
      name: parsed.data.name,
      min_amount: new Prisma.Decimal(parsed.data.min_amount),
      max_amount: new Prisma.Decimal(parsed.data.max_amount),
      roi_type: parsed.data.roi_type,
      roi_value: new Prisma.Decimal(parsed.data.roi_value),
      duration_days: Number(parsed.data.duration_days),
      is_active: parsed.data.is_active ?? true
    }
  });

  return NextResponse.json({ ok: true, plan });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  await prisma.investmentPlan.update({
    where: { id },
    data: { deleted_at: new Date(), is_active: false }
  });
  return NextResponse.json({ ok: true });
}
