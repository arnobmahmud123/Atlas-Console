import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/modules/auth/services/auth-options';
import { prisma } from '@/database/prisma/client';
import { logAudit } from '@/modules/auth/services/audit.service';

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
  if (session.user.role !== 'ACCOUNTANT' && session.user.role !== 'ADMIN') {
    return NextResponse.json({ ok: false, message: 'Forbidden' }, { status: 403 });
  }

  try {
    const req = await prisma.withdrawalRequest.findUnique({ where: { id } });
    if (!req) return NextResponse.json({ ok: false, message: 'Withdrawal request not found' }, { status: 404 });
    if (req.status !== 'PENDING_ACCOUNTANT') {
      return NextResponse.json({ ok: false, message: `Cannot approve from status ${req.status}` }, { status: 400 });
    }

    const now = new Date();
    const updated = await prisma.withdrawalRequest.update({
      where: { id },
      data: {
        status: 'PENDING_ADMIN_FINAL',
        reviewed_by_accountant_id: session.user.id,
        updated_at: now
      }
    });

    await logAudit({
      userId: session.user.id,
      action: 'APPROVE',
      resource: 'withdrawal_request',
      metadata: { requestId: updated.id, stage: 'ACCOUNTANT' }
    });

    return NextResponse.json({ ok: true, message: 'Moved to admin final approval.' });
  } catch (e: any) {
    return NextResponse.json({ ok: false, message: e?.message ?? 'Failed to approve' }, { status: 500 });
  }
}
