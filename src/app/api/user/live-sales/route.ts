import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { Prisma } from '@prisma/client';
import { authOptions } from '@/modules/auth/services/auth-options';
import { prisma } from '@/database/prisma/client';

function parseDateParam(value?: string | null) {
  const raw = (value ?? '').trim();
  if (!raw) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return 'INVALID' as const;
  const date = new Date(`${raw}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return 'INVALID' as const;
  return date;
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const parsedDate = parseDateParam(searchParams.get('date'));
  if (parsedDate === 'INVALID') {
    return NextResponse.json({ ok: false, errors: { date: ['Invalid date. Use YYYY-MM-DD'] } }, { status: 400 });
  }

  try {
    const [recentDays, selected] = await Promise.all([
      prisma.dailySalesSession.findMany({
        orderBy: { business_date: 'desc' },
        take: 14,
        select: {
          id: true,
          business_date: true,
          status: true,
          day_sales_total: true,
          day_profit_total: true,
          line_items_count: true
        }
      }),
      parsedDate
        ? prisma.dailySalesSession.findUnique({
            where: { business_date: parsedDate },
            include: { entries: { orderBy: { created_at: 'desc' }, take: 100 } }
          })
        : prisma.dailySalesSession.findFirst({
            orderBy: { business_date: 'desc' },
            include: { entries: { orderBy: { created_at: 'desc' }, take: 100 } }
          })
    ]);

    return NextResponse.json({
      ok: true,
      data: {
        session: selected,
        recentDays
      }
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2021') {
      return NextResponse.json({ ok: false, message: 'Daily sales board is not ready yet. Migration pending.' }, { status: 500 });
    }
    console.error('[api/user/live-sales] failed', err);
    return NextResponse.json({ ok: false, message: 'Failed to load live sales board' }, { status: 500 });
  }
}

