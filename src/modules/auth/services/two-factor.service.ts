import crypto from 'crypto';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { prisma } from '@/database/prisma/client';

const RECOVERY_CODE_COUNT = 8;
const RECOVERY_CODE_BYTES = 8;

function hashCode(code: string) {
  return crypto.createHash('sha256').update(code).digest('hex');
}

function generateRecoveryCodes() {
  const codes: string[] = [];
  for (let i = 0; i < RECOVERY_CODE_COUNT; i += 1) {
    codes.push(crypto.randomBytes(RECOVERY_CODE_BYTES).toString('hex'));
  }
  return codes;
}

export async function setupTwoFactor(params: { userId: string; label: string }) {
  const secret = speakeasy.generateSecret({ name: params.label });
  const recoveryCodes = generateRecoveryCodes();
  const now = new Date();

  await prisma.twoFactorSecret.upsert({
    where: { user_id: params.userId },
    update: {
      secret_base32: secret.base32,
      enabled: false,
      recovery_codes: recoveryCodes.map(hashCode),
      updated_at: now
    },
    create: {
      id: crypto.randomUUID(),
      user_id: params.userId,
      secret_base32: secret.base32,
      enabled: false,
      recovery_codes: recoveryCodes.map(hashCode),
      updated_at: now
    }
  });

  const qrCodeDataUrl = await QRCode.toDataURL(secret.otpauth_url ?? '');

  return {
    qrCodeDataUrl,
    secret: secret.base32,
    recoveryCodes
  };
}

export async function regenerateRecoveryCodes(userId: string) {
  const recoveryCodes = generateRecoveryCodes();
  await prisma.twoFactorSecret.update({
    where: { user_id: userId },
    data: { recovery_codes: recoveryCodes.map(hashCode), updated_at: new Date() }
  });
  return recoveryCodes;
}

export async function enableTwoFactor(params: {
  userId: string;
  token: string;
}) {
  const normalizedToken = String(params.token ?? '').replace(/\D/g, '');
  if (normalizedToken.length < 6 || normalizedToken.length > 8) {
    throw new Error('Token must be 6-8 digits');
  }

  const record = await prisma.twoFactorSecret.findUnique({ where: { user_id: params.userId } });
  if (!record) throw new Error('2FA not initialized');

  const ok = speakeasy.totp.verify({
    secret: record.secret_base32,
    encoding: 'base32',
    token: normalizedToken,
    window: 1
  });

  if (!ok) throw new Error('Invalid 2FA token');

  await prisma.twoFactorSecret.update({
    where: { user_id: params.userId },
    data: { enabled: true, updated_at: new Date() }
  });

  return { ok: true };
}

export async function disableTwoFactor(params: { userId: string }) {
  await prisma.twoFactorSecret.update({
    where: { user_id: params.userId },
    data: { enabled: false, updated_at: new Date() }
  });
}

export async function verifyTwoFactor(params: {
  userId: string;
  token?: string;
  recoveryCode?: string;
}) {
  const record = await prisma.twoFactorSecret.findUnique({ where: { user_id: params.userId } });
  if (!record || !record.enabled) return false;

  if (params.token) {
    const normalizedToken = String(params.token ?? '').replace(/\D/g, '');
    const ok = speakeasy.totp.verify({
      secret: record.secret_base32,
      encoding: 'base32',
      token: normalizedToken,
      window: 1
    });
    if (ok) return true;
  }

  if (params.recoveryCode) {
    const hashed = hashCode(params.recoveryCode);
    if (record.recovery_codes.includes(hashed)) {
      await prisma.twoFactorSecret.update({
        where: { user_id: params.userId },
        data: {
          recovery_codes: record.recovery_codes.filter(code => code !== hashed),
          updated_at: new Date()
        }
      });
      return true;
    }
  }

  return false;
}

export async function isTwoFactorEnabled(userId: string) {
  const record = await prisma.twoFactorSecret.findUnique({ where: { user_id: userId } });
  return Boolean(record?.enabled);
}
