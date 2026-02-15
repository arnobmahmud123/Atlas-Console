import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { authOptions } from '@/modules/auth/services/auth-options';
import { finalRejectProfitBatch } from '@/services/profit-distribution.service';
import { logAudit } from '@/modules/auth/services/audit.service';
import { sanitizeString, zDecimalString } from '@/lib/http/sanitize';
import { getPrismaMigrationMessage } from '@/lib/http/prisma-errors';
import { sendNotification } from '@/services/notification.service';

const schema = z.object({
  reason: z.preprocess(sanitizeString, z.string().min(3).max(300)).optional(),
  mode: z.enum(['REQUEST_CHANGES', 'FINAL_REJECT']).default('FINAL_REJECT'),
  attachmentUrl: z.preprocess(sanitizeString, z.string().url().max(500)).optional(),
  adjustedTotalProfit: zDecimalString().optional()
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
  if (session.user.role !== 'ADMIN') return NextResponse.json({ ok: false, message: 'Forbidden' }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, errors: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  try {
    const adjustedTotalProfit = parsed.data.adjustedTotalProfit
      ? new Prisma.Decimal(parsed.data.adjustedTotalProfit)
      : undefined;
    if (adjustedTotalProfit && adjustedTotalProfit.lte(0)) {
      return NextResponse.json({ ok: false, message: 'Adjusted total profit must be greater than 0' }, { status: 400 });
    }

    const batch = await finalRejectProfitBatch({
      batchId: id,
      adminId: session.user.id,
      reason: parsed.data.reason,
      attachmentUrl: parsed.data.attachmentUrl ?? null,
      adjustedTotalProfit,
      mode: parsed.data.mode
    });

    const modeText = parsed.data.mode === 'FINAL_REJECT' ? 'final rejected' : 'returned for changes';
    await sendNotification(
      batch.created_by_accountant_id,
      'WARNING',
      'Profit Batch Review Update',
      `Profit batch ${batch.id} was ${modeText}${parsed.data.reason ? `. Reason: ${parsed.data.reason}` : '.'}${parsed.data.attachmentUrl ? ` Attachment: ${parsed.data.attachmentUrl}` : ''}`
    ).catch(() => null);
    await logAudit({
      userId: session.user.id,
      action: parsed.data.mode,
      resource: 'profit_batch',
      metadata: {
        batchId: id,
        reason: parsed.data.reason ?? null,
        attachmentUrl: parsed.data.attachmentUrl ?? null,
        adjustedTotalProfit: adjustedTotalProfit?.toString() ?? null
      }
    });
    return NextResponse.json({
      ok: true,
      message: parsed.data.mode === 'FINAL_REJECT' ? 'Profit batch final rejected.' : 'Profit batch returned to accountant for revision.',
      batch
    });
  } catch (e: any) {
    const mapped = getPrismaMigrationMessage(e, 'Failed to reject profit batch');
    return NextResponse.json({ ok: false, message: mapped.message }, { status: mapped.status });
  }
}
