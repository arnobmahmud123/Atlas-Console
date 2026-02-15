import type { Prisma } from '@prisma/client';
import { prisma } from '@/database/prisma/client';
import { validateWithdrawal } from '@/services/withdrawal.validation';
import { withWalletLock } from '@/services/wallet-lock.service';
import crypto from 'crypto';
import { requestEmailOtp, verifyEmailOtp } from '@/modules/auth/services/email-otp.service';

export async function createWithdrawalRequest(params: {
  userId: string;
  amount: Prisma.Decimal;
  withdrawMethod: 'BANK' | 'CRYPTO' | 'MANUAL' | 'MOBILE_BANKING';
  dailyLimit: Prisma.Decimal;
  otp?: string;
}) {
  return withWalletLock(`withdrawal:${params.userId}`, async () => {
    const user = await prisma.user.findUnique({ where: { id: params.userId }, select: { email: true } });
    if (!user?.email) return { ok: false, errors: ['User not found'] };

    if (!params.otp) {
      const sent = await requestEmailOtp({ userId: params.userId, email: user.email, purpose: 'WITHDRAWAL' });
      const msg =
        process.env.NODE_ENV !== 'production' && sent.devCode
          ? `Verification code sent. (Dev code: ${sent.devCode})`
          : 'Verification code sent to your email.';
      return { ok: false, errors: [msg] };
    }

    const verified = await verifyEmailOtp({ userId: params.userId, purpose: 'WITHDRAWAL', code: params.otp });
    if (!verified.ok) return { ok: false, errors: [verified.error] };

    const validation = await validateWithdrawal({
      userId: params.userId,
      amount: params.amount,
      dailyLimit: params.dailyLimit
    });

    if (!validation.ok) {
      return { ok: false, errors: validation.errors };
    }

    const now = new Date();
    const withdrawal = await prisma.withdrawal.create({
      data: {
        id: crypto.randomUUID(),
        user_id: params.userId,
        amount: params.amount,
        withdraw_method: params.withdrawMethod,
        status: 'PENDING',
        updated_at: now
      }
    });

    return { ok: true, withdrawalId: withdrawal.id };
  });
}
