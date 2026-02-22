import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { DailySalesSessionStatus, Prisma } from '@prisma/client';
import { authOptions } from '@/modules/auth/services/auth-options';
import { prisma } from '@/database/prisma/client';

function parseBusinessDate(value?: string | null) {
  const raw = (value ?? '').trim();
  const dateStr = raw || new Date().toISOString().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return null;
  const date = new Date(`${dateStr}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return null;
  return { dateStr, date };
}

async function ensureAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  if (session.user.role !== 'ADMIN' && session.user.role !== 'ACCOUNTANT') return null;
  return session;
}

export async function GET(request: Request) {
  const session = await ensureAdmin();
  if (!session) return NextResponse.json({ ok: false }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const parsedDate = parseBusinessDate(searchParams.get('date'));
  if (!parsedDate) {
    return NextResponse.json({ ok: false, errors: { date: ['Invalid date. Use YYYY-MM-DD'] } }, { status: 400 });
  }

  const ensure = searchParams.get('ensure') === '1';

  let salesDay = null;
  try {
    salesDay = await prisma.dailySalesSession.findUnique({
      where: { business_date: parsedDate.date },
      include: {
        entries: { orderBy: { created_at: 'asc' } }
      }
    });

    if (!salesDay && ensure) {
      salesDay = await prisma.dailySalesSession.create({
        data: {
          id: crypto.randomUUID(),
          business_date: parsedDate.date,
          status: DailySalesSessionStatus.OPEN,
          updated_at: new Date()
        },
        include: {
          entries: { orderBy: { created_at: 'asc' } }
        }
      });
    }
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2021') {
      return NextResponse.json(
        { ok: false, message: 'Daily sales tables not found. Run Prisma migration first.' },
        { status: 500 }
      );
    }
    console.error('[daily-sales GET] failed', err);
    return NextResponse.json({ ok: false, message: 'Failed to load daily sales session' }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    date: parsedDate.dateStr,
    session: salesDay
  });
}
