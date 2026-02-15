import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { authOptions } from '@/modules/auth/services/auth-options';
import { sanitizeString, zDecimalString } from '@/lib/http/sanitize';
import { getPrismaMigrationMessage } from '@/lib/http/prisma-errors';
import { logAudit } from '@/modules/auth/services/audit.service';
import { resubmitProfitBatch } from '@/services/profit-distribution.service';

const schema = z.object({
  totalProfit: zDecimalString().optional(),
  submissionAttachmentUrl: z.preprocess(sanitizeString, z.string().url().max(500)).optional(),
  submittedNote: z.preprocess(sanitizeString, z.string().max(500)).optional()
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
  if (session.user.role !== 'ACCOUNTANT' && session.user.role !== 'ADMIN') {
    return NextResponse.json({ ok: false, message: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, errors: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const totalProfit = parsed.data.totalProfit ? new Prisma.Decimal(parsed.data.totalProfit) : undefined;
  if (totalProfit && totalProfit.lte(0)) {
    return NextResponse.json({ ok: false, message: 'Total profit must be greater than 0' }, { status: 400 });
  }

  try {
    const batch = await resubmitProfitBatch({
      batchId: id,
      accountantId: session.user.id,
      totalProfit,
      submissionAttachmentUrl: parsed.data.submissionAttachmentUrl ?? null,
      submittedNote: parsed.data.submittedNote ?? null
    });

    await logAudit({
      userId: session.user.id,
      action: 'RESUBMIT',
      resource: 'profit_batch',
      metadata: { batchId: id, totalProfit: totalProfit?.toString() ?? null }
    });

    return NextResponse.json({ ok: true, message: 'Batch resubmitted for admin review.', batch });
  } catch (e: any) {
    const mapped = getPrismaMigrationMessage(e, 'Failed to resubmit profit batch');
    return NextResponse.json({ ok: false, message: mapped.message }, { status: mapped.status });
  }
}
