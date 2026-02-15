import { prisma } from '@/database/prisma/client';
import { Prisma } from '@prisma/client';
import { processDeposit } from '@/services/deposit.service';
import { sendEmail, emailDepositSuccess } from '@/services/email.service';

export type PaymentEvent = {
  provider: 'STRIPE' | 'CRYPTO' | 'MANUAL' | 'BANK';
  signature: string;
  payload: unknown;
  externalReference: string;
  amount: string;
  userId: string;
  debitAccountId: string;
  creditAccountId: string;
};

export async function handlePaymentWebhook(event: PaymentEvent) {
  const verified = await verifyWebhookSignature(event);
  if (!verified) throw new Error('Invalid webhook signature');

  const deposit = await prisma.deposit.findFirst({
    where: { external_reference: event.externalReference }
  });

  if (!deposit) throw new Error('Deposit not found');

  if (deposit.status === 'SUCCESS') {
    return { ok: true, idempotent: true };
  }

  await prisma.$transaction(async tx => {
    await tx.deposit.update({
      where: { id: deposit.id },
      data: { status: 'SUCCESS' }
    });

    await processDeposit({
      userId: event.userId,
      amount: new Prisma.Decimal(event.amount),
      debitAccountId: event.debitAccountId,
      creditAccountId: event.creditAccountId,
      referenceId: deposit.id
    });
  });

  const user = await prisma.user.findUnique({ where: { id: deposit.user_id }, select: { email: true } });
  if (user?.email) {
    const tmpl = emailDepositSuccess(event.amount);
    await sendEmail({ to: user.email, ...tmpl });
  }

  return { ok: true };
}

async function verifyWebhookSignature(_event: PaymentEvent) {
  // Placeholder: implement provider-specific verification
  return true;
}
