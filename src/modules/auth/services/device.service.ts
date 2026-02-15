import crypto from 'crypto';
import { prisma } from '@/database/prisma/client';

export function getClientIp(headers: Headers) {
  return (
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headers.get('x-real-ip') ||
    'unknown'
  );
}

export function getUserAgent(headers: Headers) {
  return headers.get('user-agent') ?? 'unknown';
}

export function computeFingerprint(headers: Headers) {
  const provided = headers.get('x-device-fingerprint');
  if (provided) return provided;
  const raw = `${getUserAgent(headers)}|${getClientIp(headers)}`;
  return crypto.createHash('sha256').update(raw).digest('hex');
}

export async function upsertDeviceFingerprint(params: {
  userId: string;
  fingerprint: string;
  ipAddress: string;
  userAgent: string;
}) {
  return prisma.deviceFingerprint.upsert({
    where: { fingerprint: params.fingerprint },
    update: {
      user_id: params.userId,
      ip_address: params.ipAddress,
      user_agent: params.userAgent,
      last_seen_at: new Date(),
      updated_at: new Date()
    },
    create: {
      id: crypto.randomUUID(),
      user_id: params.userId,
      fingerprint: params.fingerprint,
      ip_address: params.ipAddress,
      user_agent: params.userAgent,
      last_seen_at: new Date(),
      updated_at: new Date()
    }
  });
}
