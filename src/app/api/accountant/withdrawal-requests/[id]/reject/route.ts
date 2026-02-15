import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/modules/auth/services/auth-options';
import { prisma } from '@/database/prisma/client';
import { zSanitizedString } from '@/lib/http/sanitize';
import { logAudit } from '@/modules/auth/services/audit.service';

const schema = z.object({
  reason: zSanitizedString().min(3).max(240)
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
  if (session.user.role !== 'ACCOUNTANT' && session.user.role !== 'ADMIN') {
    return NextResponse.json({ ok: false, message: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, errors: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  try {
    const req = await prisma.withdrawalRequest.findUnique({ where: { id } });
    if (!req) return NextResponse.json({ ok: false, message: 'Withdrawal request not found' }, { status: 404 });
    if (req.status !== 'PENDING_ACCOUNTANT') {
      return NextResponse.json({ ok: false, message: `Cannot reject from status ${req.status}` }, { status: 400 });
    }

    const now = new Date();
    const updated = await prisma.withdrawalRequest.update({
      where: { id },
      data: {
        status: 'REJECTED',
        reviewed_by_accountant_id: session.user.id,
        reject_reason: parsed.data.reason,
        updated_at: now
      }
    });

    await logAudit({
      userId: session.user.id,
      action: 'REJECT',
      resource: 'withdrawal_request',
      metadata: { requestId: updated.id, stage: 'ACCOUNTANT', reason: parsed.data.reason }
    });

    return NextResponse.json({ ok: true, message: 'Rejected.' });
  } catch (e: any) {
    return NextResponse.json({ ok: false, message: e?.message ?? 'Failed to reject' }, { status: 500 });
  }
}
