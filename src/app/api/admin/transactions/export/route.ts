import { getServerSession } from 'next-auth';
import { authOptions } from '@/modules/auth/services/auth-options';
import { prisma } from '@/database/prisma/client';
import { TransactionType } from '@prisma/client';

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
  const status = searchParams.get('status') ?? undefined;
  const typeRaw = searchParams.get('type') ?? undefined;
  const email = searchParams.get('email') ?? undefined;
  const start = searchParams.get('start') ?? undefined;
  const end = searchParams.get('end') ?? undefined;

  const type =
    typeRaw && (Object.values(TransactionType) as string[]).includes(typeRaw)
      ? (typeRaw as TransactionType)
      : undefined;

  const created_at =
    start || end
      ? {
          ...(start ? { gte: new Date(start) } : {}),
          ...(end ? { lte: new Date(end) } : {})
        }
      : undefined;

  const transactions = await prisma.transaction.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(type ? { type } : {}),
      ...(created_at ? { created_at } : {}),
      ...(email ? { User: { email: { contains: email, mode: 'insensitive' } } } : {})
    },
    orderBy: { created_at: 'desc' },
    include: { User: { select: { email: true } } }
  });

  const header = ['id', 'user', 'type', 'status', 'amount', 'currency', 'created_at'].join(',');
  const rows = transactions.map(tx => [
    tx.id,
    tx.User?.email ?? '',
    tx.type,
    tx.status,
    tx.amount.toString(),
    tx.currency,
    tx.created_at.toISOString()
  ].map(csvEscape).join(','));

  const csv = [header, ...rows].join('\n');

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="transactions.csv"'
    }
  });
}
