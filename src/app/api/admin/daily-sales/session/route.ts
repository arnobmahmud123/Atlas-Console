import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/modules/auth/services/auth-options';
import { prisma } from '@/database/prisma/client';

const bodySchema = z.object({
  date: z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/),
  action: z.enum(['END_DAY', 'REOPEN'])
});

function parseBusinessDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

export async function PATCH(request: Request) {
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

  const existing = await prisma.dailySalesSession.findUnique({
    where: { business_date: businessDate }
  });
  if (!existing) {
    return NextResponse.json({ ok: false, message: 'No sales day session found for this date' }, { status: 404 });
  }

  const now = new Date();
  const updated = await prisma.dailySalesSession.update({
    where: { id: existing.id },
    data:
      parsed.data.action === 'END_DAY'
        ? {
            status: 'CLOSED',
            ended_at: now,
            locked_at: now,
            locked_by: session.user.id,
            updated_at: now
          }
        : {
            status: 'OPEN',
            reopened_at: now,
            reopened_by: session.user.id,
            ended_at: null,
            locked_at: null,
            locked_by: null,
            updated_at: now
          },
    include: {
      entries: { orderBy: { created_at: 'asc' } }
    }
  });

  return NextResponse.json({
    ok: true,
    session: updated,
    message: parsed.data.action === 'END_DAY' ? 'Day closed and locked.' : 'Day re-opened.'
  });
}

