import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/modules/auth/services/auth-options';
import { prisma } from '@/database/prisma/client';
import { zSanitizedString } from '@/lib/http/sanitize';
import { logAudit } from '@/modules/auth/services/audit.service';
import { sendNotification } from '@/services/notification.service';

const schema = z.object({ reason: zSanitizedString().min(3).max(240) });

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ ok: false }, { status: 401 });
  if (session.user.role !== 'ADMIN') return NextResponse.json({ ok: false }, { status: 403 });

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false, errors: parsed.error.flatten().fieldErrors }, { status: 400 });

  const now = new Date();
  const updated = await prisma.withdrawalRequest.update({
    where: { id },
    data: {
      status: 'REJECTED',
      reject_reason: parsed.data.reason,
      finalized_by_admin_id: session.user.id,
      updated_at: now
    },
    select: {
      id: true,
      reviewed_by_accountant_id: true
    }
  });

  if (updated.reviewed_by_accountant_id) {
    await sendNotification(
      updated.reviewed_by_accountant_id,
      'WARNING',
      'Withdrawal Rejected By Admin',
      `Withdrawal request ${updated.id} was rejected by admin. Reason: ${parsed.data.reason}`
    ).catch(() => null);
  }

  await logAudit({
    userId: session.user.id,
    action: 'FINAL_REJECT',
    resource: 'withdrawal_request',
    metadata: { requestId: id, reason: parsed.data.reason }
  });

  return NextResponse.json({ ok: true, message: 'Withdrawal rejected.' });
}
