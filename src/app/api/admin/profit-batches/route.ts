import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/modules/auth/services/auth-options';
import { prisma } from '@/database/prisma/client';
import { ProfitBatchStatus } from '@prisma/client';
import { getPrismaMigrationMessage } from '@/lib/http/prisma-errors';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
  if (session.user.role !== 'ADMIN') return NextResponse.json({ ok: false, message: 'Forbidden' }, { status: 403 });

  const url = new URL(request.url);
  const statusRaw = url.searchParams.get('status') ?? 'PENDING_ADMIN_FINAL';
  const status =
    (Object.values(ProfitBatchStatus) as string[]).includes(statusRaw)
      ? (statusRaw as ProfitBatchStatus)
      : ProfitBatchStatus.PENDING_ADMIN_FINAL;

  try {
    const batches = await prisma.profitBatch.findMany({
      where: { status },
      orderBy: { created_at: 'asc' },
      include: {
        CreatedByAccountant: { select: { email: true } },
        FinalizedByAdmin: { select: { email: true } },
        comments: {
          orderBy: { created_at: 'desc' },
          take: 8,
          include: { author: { select: { email: true } } }
        },
        _count: { select: { allocations: true } }
      },
      take: 200
    });

    const activeByUser = await prisma.investmentPosition.groupBy({
      by: ['user_id'],
      where: { status: 'ACTIVE' },
      _sum: { invested_amount: true }
    });
    const activeRows = activeByUser.filter(r => Number(r._sum.invested_amount ?? 0) > 0);
    const previewRecipients = activeRows.length;
    const previewTotalInvestment = activeRows
      .reduce((sum, r) => sum + Number(r._sum.invested_amount ?? 0), 0)
      .toString();

    const data = batches.map(b => ({
      ...b,
      total_investment_amount: b.total_investment_amount ?? previewTotalInvestment,
      recipient_count: b.recipient_count ?? previewRecipients
    }));

    return NextResponse.json({ ok: true, data });
  } catch (e: any) {
    const mapped = getPrismaMigrationMessage(e, 'Failed to load profit batches');
    return NextResponse.json({ ok: false, message: mapped.message }, { status: mapped.status });
  }
}
