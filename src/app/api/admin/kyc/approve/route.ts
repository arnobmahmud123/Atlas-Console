import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/modules/auth/services/auth-options';
import { prisma } from '@/database/prisma/client';
import { sendEmail, emailKycStatus } from '@/services/email.service';
import { sanitizeString } from '@/lib/http/sanitize';

const zOptionalUuid = () =>
  z.preprocess(value => {
    const sanitized = sanitizeString(value);
    return sanitized == null || sanitized === '' ? undefined : sanitized;
  }, z.string().uuid().optional());

const schema = z.object({
  kycId: zOptionalUuid(),
  id: zOptionalUuid()
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  let raw: unknown = {};
  const contentType = request.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    raw = await request.json().catch(() => ({}));
  } else {
    const form = await request.formData();
    raw = { kycId: form.get('kycId'), id: form.get('id') };
  }

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, errors: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const kycId = parsed.data.kycId ?? parsed.data.id;
  if (!kycId) {
    return NextResponse.json({ ok: false, errors: { kycId: ['KYC id is required'] } }, { status: 400 });
  }

  const kyc = await prisma.kyc.update({
    where: { id: kycId },
    data: { status: 'APPROVED', reviewed_by: session.user.id }
  });

  const user = await prisma.user.findUnique({ where: { id: kyc.user_id }, select: { email: true } });
  let emailWarning: string | null = null;
  if (user?.email) {
    const tmpl = emailKycStatus('APPROVED');
    try {
      await sendEmail({ to: user.email, ...tmpl });
    } catch (e) {
      emailWarning = e instanceof Error ? e.message : 'Failed to send email';
    }
  }

  return NextResponse.json({
    ok: true,
    message: emailWarning ? 'KYC approved (email not sent)' : 'KYC approved',
    kyc,
    warning: emailWarning
  });
}
