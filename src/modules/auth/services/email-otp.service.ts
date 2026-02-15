import crypto from 'crypto';
import { prisma } from '@/database/prisma/client';
import { sendEmail } from '@/services/email.service';

type Purpose = 'WITHDRAWAL';

const OTP_TTL_SECONDS = 10 * 60;
const MAX_ATTEMPTS = 5;

function hash(code: string) {
  return crypto.createHash('sha256').update(code).digest('hex');
}

function randomCode() {
  return String(crypto.randomInt(0, 1000000)).padStart(6, '0');
}

export async function requestEmailOtp(params: { userId: string; email: string; purpose: Purpose }) {
  const code = randomCode();
  const expiresAt = new Date(Date.now() + OTP_TTL_SECONDS * 1000);
  const codeHash = hash(code);

  // Keep a single active code per purpose/user.
  await prisma.emailOtp.updateMany({
    where: { user_id: params.userId, purpose: params.purpose, consumed_at: null },
    data: { consumed_at: new Date() }
  });

  await prisma.emailOtp.create({
    data: {
      id: crypto.randomUUID(),
      user_id: params.userId,
      purpose: params.purpose,
      code_hash: codeHash,
      expires_at: expiresAt
    }
  });

  const subject = 'Withdrawal verification code';
  const text = `Your verification code is ${code}. It expires in 10 minutes.`;
  const result = await sendEmail({ to: params.email, subject, text });

  // Dev convenience when SMTP is skipped/unavailable.
  const devCode = process.env.NODE_ENV !== 'production' && (result as any)?.skipped ? code : undefined;
  return { ok: true as const, devCode };
}

export async function verifyEmailOtp(params: { userId: string; purpose: Purpose; code: string }) {
  const now = new Date();
  const record = await prisma.emailOtp.findFirst({
    where: {
      user_id: params.userId,
      purpose: params.purpose,
      consumed_at: null
    },
    orderBy: { created_at: 'desc' }
  });

  if (!record) return { ok: false as const, error: 'Code expired' };
  if (record.expires_at <= now) {
    await prisma.emailOtp.update({ where: { id: record.id }, data: { consumed_at: now } }).catch(() => null);
    return { ok: false as const, error: 'Code expired' };
  }

  if (record.attempts >= MAX_ATTEMPTS) {
    await prisma.emailOtp.update({ where: { id: record.id }, data: { consumed_at: now } }).catch(() => null);
    return { ok: false as const, error: 'Too many attempts' };
  }

  const ok = hash(params.code) === record.code_hash;
  if (!ok) {
    await prisma.emailOtp.update({
      where: { id: record.id },
      data: { attempts: record.attempts + 1 }
    });
    return { ok: false as const, error: 'Invalid code' };
  }

  await prisma.emailOtp.update({
    where: { id: record.id },
    data: { consumed_at: now }
  });

  return { ok: true as const };
}

