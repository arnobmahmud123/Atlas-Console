import { prisma } from '@/database/prisma/client';
import { Prisma } from '@prisma/client';
import crypto from 'crypto';

export async function logLoginAttempt(params: {
  userId: string;
  ipAddress: string;
  userAgent: string;
  succeeded: boolean;
}) {
  await prisma.loginHistory.create({
    data: {
      id: crypto.randomUUID(),
      user_id: params.userId,
      ip_address: params.ipAddress,
      user_agent: params.userAgent,
      succeeded: params.succeeded,
      updated_at: new Date()
    }
  });
}

export async function logAudit(params: {
  userId?: string;
  action: string;
  resource: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}) {
  const now = new Date();
  await prisma.auditLog.create({
    data: {
      id: crypto.randomUUID(),
      user_id: params.userId,
      action: params.action,
      resource: params.resource,
      metadata: params.metadata as Prisma.InputJsonValue | undefined,
      ip_address: params.ipAddress,
      user_agent: params.userAgent,
      updated_at: now
    }
  });
}
