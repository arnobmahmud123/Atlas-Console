import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { authOptions } from '@/modules/auth/services/auth-options';
import { prisma } from '@/database/prisma/client';

const bodySchema = z
  .object({
    date: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/),
    productName: z.string().trim().min(1),
    productId: z.string().trim().optional().or(z.literal('')),
    quantity: z.coerce.number().int().positive(),
    sellingPrice: z.coerce.number().positive(),
    costPrice: z.coerce.number().nonnegative().optional(),
    lineProfit: z.coerce.number().optional()
  })
  .refine(data => data.costPrice !== undefined || data.lineProfit !== undefined, {
    message: 'Provide costPrice or lineProfit',
    path: ['costPrice']
  });

function decimal(n: number | string) {
  return new Prisma.Decimal(n);
}

function parseBusinessDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return NextResponse.json({ ok: false }, { status: 403 });
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

  const businessDate = parseBusinessDate(parsed.data.date);
  if (!businessDate) {
    return NextResponse.json({ ok: false, errors: { date: ['Invalid date'] } }, { status: 400 });
  }

  const qty = parsed.data.quantity;
  const sellingPrice = parsed.data.sellingPrice;
  const lineTotalNum = qty * sellingPrice;
  const lineProfitNum =
    parsed.data.lineProfit !== undefined
      ? parsed.data.lineProfit
      : lineTotalNum - qty * (parsed.data.costPrice ?? 0);
  const costPriceNum =
    parsed.data.costPrice !== undefined
      ? parsed.data.costPrice
      : Math.max(0, (lineTotalNum - lineProfitNum) / qty);

  if (lineProfitNum < 0) {
    return NextResponse.json({ ok: false, errors: { lineProfit: ['Line profit cannot be negative'] } }, { status: 400 });
  }

  const result = await prisma.$transaction(async tx => {
    let salesDay = await tx.dailySalesSession.findUnique({
      where: { business_date: businessDate }
    });

    if (!salesDay) {
      salesDay = await tx.dailySalesSession.create({
        data: {
          id: crypto.randomUUID(),
          business_date: businessDate,
          updated_at: new Date()
        }
      });
    }

    if (salesDay.status === 'CLOSED') {
      throw new Error('DAY_CLOSED');
    }

    const item = await tx.dailySalesLineItem.create({
      data: {
        id: crypto.randomUUID(),
        session_id: salesDay.id,
        product_name: parsed.data.productName,
        product_id: parsed.data.productId?.trim() || null,
        quantity: qty,
        selling_price: decimal(sellingPrice),
        cost_price: decimal(costPriceNum),
        line_total: decimal(lineTotalNum),
        line_profit: decimal(lineProfitNum),
        created_by: session.user.id,
        updated_at: new Date()
      }
    });

    const nextSalesTotal = new Prisma.Decimal(salesDay.day_sales_total).plus(item.line_total);
    const nextProfitTotal = new Prisma.Decimal(salesDay.day_profit_total).plus(item.line_profit);

    const updatedSession = await tx.dailySalesSession.update({
      where: { id: salesDay.id },
      data: {
        day_sales_total: nextSalesTotal,
        day_profit_total: nextProfitTotal,
        day_balance: nextSalesTotal,
        profit_balance: nextProfitTotal,
        line_items_count: salesDay.line_items_count + 1,
        updated_at: new Date()
      },
      include: {
        entries: { orderBy: { created_at: 'asc' } }
      }
    });

    return { item, session: updatedSession };
  }).catch(err => {
    if (err instanceof Error && err.message === 'DAY_CLOSED') return 'DAY_CLOSED' as const;
    throw err;
  });

  if (result === 'DAY_CLOSED') {
    return NextResponse.json({ ok: false, message: 'This day is closed. Re-open it to add entries.' }, { status: 409 });
  }

  return NextResponse.json({ ok: true, item: result.item, session: result.session, message: 'Line item added' });
}

