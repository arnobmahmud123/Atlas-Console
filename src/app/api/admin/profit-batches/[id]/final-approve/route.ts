import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/modules/auth/services/auth-options';
import { finalApproveProfitBatch } from '@/services/profit-distribution.service';
import { logAudit } from '@/modules/auth/services/audit.service';
import { getPrismaMigrationMessage } from '@/lib/http/prisma-errors';

export async function PATCH(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
  if (session.user.role !== 'ADMIN') return NextResponse.json({ ok: false, message: 'Forbidden' }, { status: 403 });

  try {
    const result = await finalApproveProfitBatch(id, session.user.id);
    await logAudit({
      userId: session.user.id,
      action: 'FINAL_APPROVE',
      resource: 'profit_batch',
      metadata: {
        batchId: id,
        creditedCount: result.creditedCount,
        totalInvestment: result.totalInvestment.toString()
      }
    });
    return NextResponse.json({
      ok: true,
      message: 'Profit batch finalized. User profits and referral commissions have been credited.',
      data: {
        batch: result.batch,
        creditedCount: result.creditedCount,
        totalInvestment: result.totalInvestment.toString()
      }
    });
  } catch (e: any) {
    const mapped = getPrismaMigrationMessage(e, 'Failed to approve profit batch');
    return NextResponse.json({ ok: false, message: mapped.message }, { status: mapped.status });
  }
}
