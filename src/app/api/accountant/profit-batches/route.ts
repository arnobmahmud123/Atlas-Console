import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { Prisma, ProfitBatchStatus } from '@prisma/client';
import { authOptions } from '@/modules/auth/services/auth-options';
import { sanitizeString, zDecimalString } from '@/lib/http/sanitize';
import { createProfitBatch } from '@/services/profit-distribution.service';
import { logAudit } from '@/modules/auth/services/audit.service';
import { getPrismaMigrationMessage } from '@/lib/http/prisma-errors';
import { prisma } from '@/database/prisma/client';

const schema = z.object({
  periodType: z.preprocess(sanitizeString, z.enum(['DAILY', 'WEEKLY'])),
  periodStart: z.preprocess(sanitizeString, z.string().datetime()),
  periodEnd: z.preprocess(sanitizeString, z.string().datetime()),
  totalProfit: zDecimalString(),
  submissionAttachmentUrl: z.preprocess(sanitizeString, z.string().url().max(500)).optional(),
  submittedNote: z.preprocess(sanitizeString, z.string().max(500)).optional()
});

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
  if (session.user.role !== 'ACCOUNTANT' && session.user.role !== 'ADMIN') {
    return NextResponse.json({ ok: false, message: 'Forbidden' }, { status: 403 });
  }

  const url = new URL(request.url);
  const statusRaw = url.searchParams.get('status') ?? 'PENDING_ADMIN_FINAL';
  const page = Math.max(1, Number(url.searchParams.get('page') ?? 1));
  const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get('pageSize') ?? 10)));
  const format = (url.searchParams.get('format') ?? '').toLowerCase();
  const status =
    (Object.values(ProfitBatchStatus) as string[]).includes(statusRaw)
      ? (statusRaw as ProfitBatchStatus)
      : ProfitBatchStatus.PENDING_ADMIN_FINAL;

  try {
    const where = {
      status,
      ...(session.user.role === 'ACCOUNTANT' ? { created_by_accountant_id: session.user.id } : {})
    };

    const [total, data] = await Promise.all([
      prisma.profitBatch.count({ where }),
      prisma.profitBatch.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          FinalizedByAdmin: { select: { email: true } },
          comments: {
            orderBy: { created_at: 'desc' },
            take: 5,
            include: { author: { select: { email: true } } }
          }
        }
      })
    ]);

    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    let rows: any[] = data;
    if (status === 'REJECTED') {
      const rejectLogs = await prisma.auditLog.findMany({
        where: {
          action: 'FINAL_REJECT',
          resource: 'profit_batch'
        },
        orderBy: { created_at: 'desc' },
        take: 500
      });

      const reasonByBatchId: Record<string, string> = {};
      for (const log of rejectLogs) {
        const meta = log.metadata as any;
        const batchId = typeof meta?.batchId === 'string' ? meta.batchId : null;
        const reason = typeof meta?.reason === 'string' ? meta.reason : '';
        if (batchId && !reasonByBatchId[batchId]) {
          reasonByBatchId[batchId] = reason;
        }
      }

      rows = data.map(row => ({
        ...row,
        reject_reason: reasonByBatchId[row.id] ?? ''
      }));
    }

    if (format === 'csv') {
      const header = [
        'id',
        'status',
        'period_type',
        'period_start',
        'period_end',
        'total_profit',
        'recipient_count',
        'total_investment_amount',
        'submission_attachment_url',
        'created_at',
        'finalized_by_admin',
        'reject_reason'
      ];
      const escape = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
      const lines = rows.map(row =>
        [
          row.id,
          row.status,
          row.period_type,
          row.period_start,
          row.period_end,
          row.total_profit,
          row.recipient_count ?? '',
          row.total_investment_amount ?? '',
          row.submission_attachment_url ?? '',
          row.created_at,
          row.FinalizedByAdmin?.email ?? '',
          row.reject_reason ?? ''
        ]
          .map(escape)
          .join(',')
      );
      const csv = [header.join(','), ...lines].join('\n');
      return new Response(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename=\"accountant-profit-batches-${status.toLowerCase()}-p${page}.csv\"`
        }
      });
    }

    return NextResponse.json({
      ok: true,
      data: rows,
      meta: { page, pageSize, total, totalPages }
    });
  } catch (e: any) {
    const mapped = getPrismaMigrationMessage(e, 'Failed to load profit batches');
    return NextResponse.json({ ok: false, message: mapped.message }, { status: mapped.status });
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
  if (session.user.role !== 'ACCOUNTANT' && session.user.role !== 'ADMIN') {
    return NextResponse.json({ ok: false, message: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ ok: false, message: 'Invalid request body' }, { status: 400 });

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, errors: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const totalProfit = new Prisma.Decimal(parsed.data.totalProfit);
  if (totalProfit.lte(0)) {
    return NextResponse.json({ ok: false, message: 'Total profit must be greater than 0' }, { status: 400 });
  }

  const periodStart = new Date(parsed.data.periodStart);
  const periodEnd = new Date(parsed.data.periodEnd);
  if (periodEnd < periodStart) {
    return NextResponse.json({ ok: false, message: 'periodEnd must be after periodStart' }, { status: 400 });
  }

  try {
    const batch = await createProfitBatch({
      periodType: parsed.data.periodType,
      periodStart,
      periodEnd,
      totalProfit,
      createdByAccountantId: session.user.id,
      submissionAttachmentUrl: parsed.data.submissionAttachmentUrl ?? null,
      submittedNote: parsed.data.submittedNote ?? null
    });

    await logAudit({
      userId: session.user.id,
      action: 'CREATE',
      resource: 'profit_batch',
      metadata: { batchId: batch.id, periodType: batch.period_type, totalProfit: batch.total_profit.toString() }
    });

    return NextResponse.json({ ok: true, message: 'Profit batch submitted for admin final approval.', batch });
  } catch (e: any) {
    const mapped = getPrismaMigrationMessage(e, 'Failed to create profit batch');
    return NextResponse.json({ ok: false, message: mapped.message }, { status: mapped.status });
  }
}
