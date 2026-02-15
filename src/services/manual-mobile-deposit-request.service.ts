import { Prisma } from '@prisma/client';
import crypto from 'crypto';
import { prisma } from '@/database/prisma/client';

export async function createManualMobileDepositRequest(params: {
  userId: string;
  method: 'BKASH' | 'NAGAD';
  amount: Prisma.Decimal;
  transactionId: string;
  receiptFileUrl?: string | null;
}) {
  const latestKyc = await prisma.kyc.findFirst({
    where: { user_id: params.userId },
    orderBy: { created_at: 'desc' },
    select: { status: true }
  });
  if (!latestKyc || latestKyc.status !== 'APPROVED') {
    return { ok: false as const, message: 'KYC must be approved before depositing.' };
  }

  if (params.amount.lte(0)) {
    return { ok: false as const, message: 'Amount must be greater than 0.' };
  }

  const now = new Date();
  const request = await prisma.depositRequest.create({
    data: {
      id: crypto.randomUUID(),
      user_id: params.userId,
      method: params.method,
      amount: params.amount,
      transaction_id: params.transactionId,
      receipt_file_url: params.receiptFileUrl ?? null,
      status: 'PENDING_ACCOUNTANT',
      updated_at: now
    }
  });

  return { ok: true as const, requestId: request.id };
}

