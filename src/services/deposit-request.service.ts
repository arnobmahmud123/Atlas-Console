import { prisma } from '@/database/prisma/client';
import type { Prisma } from '@prisma/client';
import crypto from 'crypto';

export async function createDepositRequest(
  userId: string,
  amount: Prisma.Decimal,
  paymentMethod: 'STRIPE' | 'CRYPTO' | 'MANUAL' | 'BANK'
) {
  const kyc = await prisma.kyc.findFirst({
    where: { user_id: userId },
    orderBy: { created_at: 'desc' },
    select: { status: true }
  });

  if (!kyc || kyc.status !== 'APPROVED') {
    throw new Error('KYC not approved');
  }

  const now = new Date();
  const deposit = await prisma.deposit.create({
    data: {
      id: crypto.randomUUID(),
      user_id: userId,
      amount,
      payment_method: paymentMethod,
      status: 'PENDING',
      updated_at: now
    }
  });

  return {
    depositId: deposit.id,
    instruction: 'Payment instructions pending provider integration.'
  };
}
