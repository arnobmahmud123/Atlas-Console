import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { WithdrawalRequestStatus } from '@prisma/client';
import { authOptions } from '@/modules/auth/services/auth-options';
import { prisma } from '@/database/prisma/client';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ ok: false }, { status: 401 });
  if (session.user.role !== 'ACCOUNTANT' && session.user.role !== 'ADMIN') {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  const url = new URL(request.url);
  const statusRaw = url.searchParams.get('status') ?? 'PENDING_ACCOUNTANT';
  const page = Math.max(1, Number(url.searchParams.get('page') ?? 1));
  const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get('pageSize') ?? 10)));
  const format = (url.searchParams.get('format') ?? '').toLowerCase();
  const status =
    (Object.values(WithdrawalRequestStatus) as string[]).includes(statusRaw)
      ? (statusRaw as WithdrawalRequestStatus)
      : WithdrawalRequestStatus.PENDING_ACCOUNTANT;

  const where: any = { status: status as any };
  if (session.user.role === 'ACCOUNTANT' && status === 'REJECTED') {
    where.reviewed_by_accountant_id = session.user.id;
  }

  const [total, data] = await Promise.all([
    prisma.withdrawalRequest.count({ where }),
    prisma.withdrawalRequest.findMany({
      where,
      orderBy: { created_at: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        User: { select: { email: true } },
        FinalizedByAdmin: { select: { email: true } }
      }
    })
  ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  if (format === 'csv') {
    const header = [
      'id',
      'user_email',
      'method',
      'amount',
      'payout_number',
      'status',
      'created_at',
      'updated_at',
      'finalized_by_admin',
      'reject_reason'
    ];
    const escape = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const lines = data.map(row =>
      [
        row.id,
        row.User?.email ?? '',
        row.method,
        row.amount.toString(),
        row.payout_number,
        row.status,
        row.created_at.toISOString(),
        row.updated_at.toISOString(),
        row.FinalizedByAdmin?.email ?? '',
        row.reject_reason ?? ''
      ]
        .map(escape)
        .join(',')
    );
    return new Response([header.join(','), ...lines].join('\n'), {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename=\"accountant-withdrawals-${status.toLowerCase()}-p${page}.csv\"`
      }
    });
  }

  return NextResponse.json({ ok: true, data, meta: { page, pageSize, total, totalPages } });
}
