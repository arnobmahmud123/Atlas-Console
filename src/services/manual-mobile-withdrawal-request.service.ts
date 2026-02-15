import type { Prisma } from '@prisma/client';
import { prisma } from '@/database/prisma/client';
import crypto from 'crypto';
import { withWalletLock } from '@/services/wallet-lock.service';
import { validateWithdrawal } from '@/services/withdrawal.validation';
import { requestEmailOtp, verifyEmailOtp } from '@/modules/auth/services/email-otp.service';

export async function createManualMobileWithdrawalRequest(params: {
  userId: string;
  method: 'BKASH' | 'NAGAD';
  amount: Prisma.Decimal;
  payoutNumber: string;
  dailyLimit: Prisma.Decimal;
  otp?: string;
}) {
  return withWalletLock(`withdrawal_request:${params.userId}`, async () => {
    const user = await prisma.user.findUnique({ where: { id: params.userId }, select: { email: true } });
    if (!user?.email) return { ok: false as const, message: 'User not found.' };

    const latestKyc = await prisma.kyc.findFirst({
      where: { user_id: params.userId },
      orderBy: { created_at: 'desc' },
      select: { status: true }
    });
    if (!latestKyc || latestKyc.status !== 'APPROVED') {
      return { ok: false as const, message: 'KYC must be approved before withdrawing.' };
    }

    if (!params.otp) {
      const sent = await requestEmailOtp({ userId: params.userId, email: user.email, purpose: 'WITHDRAWAL' });
      const msg =
        process.env.NODE_ENV !== 'production' && sent.devCode
          ? `Verification code sent. (Dev code: ${sent.devCode})`
          : 'Verification code sent to your email.';
      return { ok: false as const, requiresOtp: true as const, message: msg };
    }

    const verified = await verifyEmailOtp({ userId: params.userId, purpose: 'WITHDRAWAL', code: params.otp });
    if (!verified.ok) return { ok: false as const, message: verified.error };

    if (params.amount.lte(0)) return { ok: false as const, message: 'Amount must be greater than 0.' };

    const validation = await validateWithdrawal({
      userId: params.userId,
      amount: params.amount,
      dailyLimit: params.dailyLimit
    });
    if (!validation.ok) return { ok: false as const, message: validation.errors[0] ?? 'Withdrawal not allowed.' };

    const now = new Date();
    const request = await prisma.withdrawalRequest.create({
      data: {
        id: crypto.randomUUID(),
        user_id: params.userId,
        method: params.method,
        amount: params.amount,
        payout_number: params.payoutNumber,
        status: 'PENDING_ACCOUNTANT',
        updated_at: now
      }
    });

    return { ok: true as const, requestId: request.id };
  });
}

