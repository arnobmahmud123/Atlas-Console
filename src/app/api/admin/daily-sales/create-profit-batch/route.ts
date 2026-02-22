import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { authOptions } from '@/modules/auth/services/auth-options';
import { prisma } from '@/database/prisma/client';
import { createProfitBatch } from '@/services/profit-distribution.service';

const bodySchema = z.object({
  date: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/)
});

function getDayRangeUtc(dateStr: string) {
  const start = new Date(`${dateStr}T00:00:00.000Z`);
  const end = new Date(`${dateStr}T23:59:59.999Z`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
  return { start, end };
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return NextResponse.json({ ok: false, message: 'Forbidden' }, { status: 403 });
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ ok: false, errors: { body: ['Invalid JSON'] } }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, errors: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const range = getDayRangeUtc(parsed.data.date);
  if (!range) {
    return NextResponse.json({ ok: false, errors: { date: ['Invalid date'] } }, { status: 400 });
  }

  let salesDay;
  try {
    salesDay = await prisma.dailySalesSession.findUnique({
      where: { business_date: range.start }
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2021') {
      return NextResponse.json({ ok: false, message: 'Daily sales tables not found. Run Prisma migration first.' }, { status: 500 });
    }
    console.error('[daily-sales create-profit-batch] load session failed', err);
    return NextResponse.json({ ok: false, message: 'Failed to load daily sales session' }, { status: 500 });
  }

  if (!salesDay) {
    return NextResponse.json({ ok: false, message: 'No sales session found for this date' }, { status: 404 });
  }
  if (salesDay.status !== 'CLOSED') {
    return NextResponse.json({ ok: false, message: 'Close (End of Day) before creating a profit batch.' }, { status: 409 });
  }
  if (new Prisma.Decimal(salesDay.day_profit_total).lte(0)) {
    return NextResponse.json({ ok: false, message: 'Day profit total must be greater than 0.' }, { status: 400 });
  }

  const existing = await prisma.profitBatch.findFirst({
    where: {
      period_type: 'DAILY',
      period_start: range.start,
      period_end: range.end
    },
    orderBy: { created_at: 'desc' }
  });
  if (existing) {
    return NextResponse.json({
      ok: false,
      message: 'A daily profit batch already exists for this date.',
      batch: existing
    }, { status: 409 });
  }

  try {
    const batch = await createProfitBatch({
      periodType: 'DAILY',
      periodStart: range.start,
      periodEnd: range.end,
      totalProfit: new Prisma.Decimal(salesDay.day_profit_total),
      createdByAccountantId: session.user.id,
      submittedNote: `Generated from Daily Sales (${parsed.data.date})`,
      submissionAttachmentUrl: null
    });

    return NextResponse.json({
      ok: true,
      batch,
      message: 'Profit batch created from daily sales. Admin can now review/final approve it.'
    });
  } catch (err) {
    console.error('[daily-sales create-profit-batch] create failed', err);
    return NextResponse.json({ ok: false, message: 'Failed to create profit batch from daily sales' }, { status: 500 });
  }
}

