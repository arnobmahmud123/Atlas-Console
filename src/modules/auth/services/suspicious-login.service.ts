import { prisma } from '@/database/prisma/client';
import { logAudit } from './audit.service';

export async function suspiciousLoginHook(params: {
  userId: string;
  fingerprint: string;
  ipAddress: string;
  userAgent: string;
}) {
  const knownDevice = await prisma.deviceFingerprint.findUnique({
    where: { fingerprint: params.fingerprint }
  });

  if (!knownDevice) {
    await logAudit({
      userId: params.userId,
      action: 'SUSPICIOUS_LOGIN',
      resource: 'auth',
      metadata: {
        reason: 'NEW_DEVICE',
        ipAddress: params.ipAddress,
        userAgent: params.userAgent
      },
      ipAddress: params.ipAddress,
      userAgent: params.userAgent
    });
  }
}
