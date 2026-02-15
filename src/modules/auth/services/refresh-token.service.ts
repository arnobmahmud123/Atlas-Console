import crypto from 'crypto';
import { prisma } from '@/database/prisma/client';

const REFRESH_TTL_DAYS = 30;

function hashToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function generateRefreshToken() {
  return crypto.randomBytes(48).toString('hex');
}

export async function issueRefreshToken(userId: string) {
  const token = generateRefreshToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000);

  const record = await prisma.refreshToken.create({
    data: {
      id: crypto.randomUUID(),
      user_id: userId,
      token_hash: tokenHash,
      expires_at: expiresAt,
      created_at: new Date()
    }
  });

  return { token, recordId: record.id, expiresAt };
}

export async function rotateRefreshToken(recordId: string) {
  const record = await prisma.refreshToken.findUnique({ where: { id: recordId } });
  if (!record || record.revoked_at || record.expires_at < new Date()) return null;

  // Revoke current token
  await prisma.refreshToken.update({
    where: { id: recordId },
    data: { revoked_at: new Date() }
  });

  // Issue new token
  const next = await issueRefreshToken(record.user_id);
  return next;
}

export async function validateRefreshToken(token: string) {
  const tokenHash = hashToken(token);
  return prisma.refreshToken.findFirst({
    where: {
      token_hash: tokenHash,
      revoked_at: null,
      expires_at: { gt: new Date() }
    }
  });
}
