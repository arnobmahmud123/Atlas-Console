import { getServerSession } from 'next-auth';
import { authOptions } from '@/modules/auth/services/auth-options';
import { prisma } from '@/database/prisma/client';
import { WithdrawalStatus } from '@prisma/client';

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
    statusRaw && (Object.values(WithdrawalStatus) as string[]).includes(statusRaw)
      ? (statusRaw as WithdrawalStatus)
      : undefined;

  const created_at =
    start || end
      ? {
          ...(start ? { gte: new Date(start) } : {}),
          ...(end ? { lte: new Date(end) } : {})
        }
      : undefined;

  const withdrawals = await prisma.withdrawal.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(created_at ? { created_at } : {}),
      ...(email ? { User_Withdrawal_user_idToUser: { email: { contains: email, mode: 'insensitive' } } } : {})
    },
    orderBy: { created_at: 'desc' },
    include: { User_Withdrawal_user_idToUser: { select: { email: true } } }
  });

  const header = ['id', 'user', 'amount', 'status', 'method', 'created_at'].join(',');
  const rows = withdrawals.map(w => [
    w.id,
    w.User_Withdrawal_user_idToUser?.email ?? '',
    w.amount.toString(),
    w.status,
    w.withdraw_method,
    w.created_at.toISOString()
  ].map(csvEscape).join(','));

  const csv = [header, ...rows].join('\n');

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="withdrawals.csv"'
    }
  });
}
