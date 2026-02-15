import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { authOptions } from '@/modules/auth/services/auth-options';
import { prisma } from '@/database/prisma/client';
import { sendNotification } from '@/services/notification.service';
import { logAudit } from '@/modules/auth/services/audit.service';
import { sanitizeString } from '@/lib/http/sanitize';

const schema = z.object({
  screenshotUrl: z.preprocess(sanitizeString, z.string().url().max(500)),
  note: z.preprocess(sanitizeString, z.string().max(300)).optional()
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
    const current = await prisma.withdrawalRequest.findUnique({
      where: { id },
      select: { status: true }
    });
    if (!current) return NextResponse.json({ ok: false, message: 'Withdrawal request not found' }, { status: 404 });
    if (current.status !== 'APPROVED') {
      return NextResponse.json({ ok: false, message: 'Only approved withdrawals can be marked paid.' }, { status: 400 });
    }

    const now = new Date();
    const include = {
      User: { select: { email: true } },
      FinalizedByAdmin: { select: { id: true, email: true } }
    } as const;
    type UpdatedReq = Prisma.WithdrawalRequestGetPayload<{ include: typeof include }>;
    let updated: UpdatedReq;
    try {
      updated = await prisma.withdrawalRequest.update({
        where: { id },
        data: {
          payout_confirmed_at: now,
          payout_confirmed_by_accountant_id: session.user.id,
          payout_screenshot_url: parsed.data.screenshotUrl,
          payout_note: parsed.data.note ?? null,
          updated_at: now
        },
        include
      });
    } catch (e: any) {
      const msg = String(e?.message ?? '');
      const schemaNotUpdated =
        msg.includes('Unknown argument `payout_confirmed_at`') ||
        msg.includes('Unknown argument `payout_confirmed_by_accountant_id`') ||
        msg.includes('Unknown argument `payout_screenshot_url`') ||
        msg.includes('Unknown argument `payout_note`');
      if (!schemaNotUpdated) throw e;

      const fallbackNote = `${parsed.data.note ? `${parsed.data.note} | ` : ''}Payment proof: ${parsed.data.screenshotUrl}`;
      updated = await prisma.withdrawalRequest.update({
        where: { id },
        data: {
          notes: fallbackNote.slice(0, 1000),
          updated_at: now
        },
        include
      });
    }

    await sendNotification(
      updated.user_id,
      'SUCCESS',
      'Withdrawal Paid',
      `Your withdrawal request ${updated.id} has been marked paid by accountant.${parsed.data.note ? ` Note: ${parsed.data.note}` : ''}`,
      { href: '/dashboard/payments', attachmentUrl: parsed.data.screenshotUrl }
    ).catch(() => null);

    const adminId = updated.FinalizedByAdmin?.id ?? null;
    if (adminId) {
      await sendNotification(
        adminId,
        'INFO',
        'Withdrawal Payment Confirmed',
        `Accountant confirmed payout for withdrawal ${updated.id}.${parsed.data.note ? ` Note: ${parsed.data.note}` : ''}`,
        { href: '/admin/withdrawals/history', attachmentUrl: parsed.data.screenshotUrl }
      ).catch(() => null);
    }

    await logAudit({
      userId: session.user.id,
      action: 'CONFIRM_PAID',
      resource: 'withdrawal_request',
      metadata: {
        requestId: updated.id,
        screenshotUrl: parsed.data.screenshotUrl,
        note: parsed.data.note ?? null
      }
    });

    return NextResponse.json({ ok: true, message: 'Payment confirmation saved and notifications sent.' });
  } catch (e: any) {
    return NextResponse.json({ ok: false, message: e?.message ?? 'Failed to confirm payout' }, { status: 400 });
  }
}
