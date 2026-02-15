import { prisma } from '@/database/prisma/client';
import { Prisma } from '@prisma/client';
import crypto from 'crypto';

export type FinancialAuditInput = {
  userId?: string;
  action: string;
  amount?: number;
  referenceId?: string;
  metadata?: Record<string, unknown>;
};

export async function logFinancialAudit(input: FinancialAuditInput) {
  return prisma.auditLog.create({
    data: {
      id: crypto.randomUUID(),
      user_id: input.userId ?? null,
      action: input.action,
      resource: 'financial',
      metadata: {
        amount: input.amount,
        referenceId: input.referenceId,
        ...input.metadata
      } as Prisma.InputJsonValue,
      updated_at: new Date()
    }
  });
}
