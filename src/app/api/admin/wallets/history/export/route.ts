import { getServerSession } from 'next-auth';
import { authOptions } from '@/modules/auth/services/auth-options';
import { prisma } from '@/database/prisma/client';

function csvEscape(value: string) {
  if (value.includes('"') || value.includes(',') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return new Response('Forbidden', { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const direction = searchParams.get('direction');
  const start = searchParams.get('start');
  const end = searchParams.get('end');

  const created_at =
    start || end
      ? {
          ...(start ? { gte: new Date(start) } : {}),
          ...(end ? { lte: new Date(end) } : {})
        }
      : undefined;

  const where = {
    ...(direction ? { direction: direction as 'DEBIT' | 'CREDIT' } : {}),
    ...(created_at ? { created_at } : {})
  };

  const entries = await prisma.ledgerEntry.findMany({
    where,
    orderBy: { created_at: 'desc' },
    select: {
      id: true,
      amount: true,
      direction: true,
      created_at: true,
      ledger_account_id: true,
      user_id: true
    },
    take: 1000
  });

  const header = ['id', 'user_id', 'ledger_account_id', 'direction', 'amount', 'created_at'].join(',');
  const rows = entries.map(e => [
    e.id,
    e.user_id,
    e.ledger_account_id,
    e.direction,
    e.amount.toString(),
    e.created_at.toISOString()
  ].map(csvEscape).join(','));

  const csv = [header, ...rows].join('\n');

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="ledger-history.csv"'
    }
  });
}
