import { prisma } from '@/database/prisma/client';
import crypto from 'crypto';

export async function createFraudFlagIfHigh(params: {
  userId: string;
  flagType: string;
  riskScore: number;
  threshold: number;
  notes?: string;
}) {
  if (params.riskScore < params.threshold) {
    return { ok: true, created: false };
  }

  const flag = await prisma.fraudFlag.create({
    data: {
      id: crypto.randomUUID(),
      user_id: params.userId,
      flag_type: params.flagType,
      risk_score: params.riskScore,
      notes: params.notes
    }
  });

  return { ok: true, created: true, flagId: flag.id };
}
