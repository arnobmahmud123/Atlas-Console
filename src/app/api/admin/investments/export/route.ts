import { getServerSession } from 'next-auth';
import { authOptions } from '@/modules/auth/services/auth-options';
import { prisma } from '@/database/prisma/client';
import { InvestmentStatus } from '@prisma/client';

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
  const statusRaw = searchParams.get('status') ?? undefined;
  const start = searchParams.get('start') ?? undefined;
  const end = searchParams.get('end') ?? undefined;
  const email = searchParams.get('email') ?? undefined;

  const status =
    statusRaw && (Object.values(InvestmentStatus) as string[]).includes(statusRaw)
      ? (statusRaw as InvestmentStatus)
      : undefined;

  const start_date =
    start || end
      ? {
          ...(start ? { gte: new Date(start) } : {}),
          ...(end ? { lte: new Date(end) } : {})
        }
      : undefined;

  const where = {
    ...(status ? { status } : {}),
    ...(start_date ? { start_date } : {}),
    ...(email ? { User: { is: { email: { contains: email, mode: 'insensitive' as const } } } } : {})
  };

  const positions = await prisma.investmentPosition.findMany({
    where,
    orderBy: { start_date: 'desc' },
    include: { User: { select: { email: true } }, InvestmentPlan: { select: { name: true } } }
  });

  const header = ['id', 'user', 'plan', 'amount', 'status', 'start_date', 'end_date'].join(',');
  const rows = positions.map(p => [
    p.id,
    p.User?.email ?? '',
    p.InvestmentPlan?.name ?? '',
    p.invested_amount.toString(),
    p.status,
    p.start_date.toISOString(),
    p.end_date.toISOString()
  ].map(csvEscape).join(','));

  const csv = [header, ...rows].join('\n');

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="investments.csv"'
    }
  });
}
