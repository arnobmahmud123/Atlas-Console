import { prisma } from '@/database/prisma/client';
import { loginSchema } from '../validators/login.validator';
import { registerSchema } from '../validators/register.validator';
import { hashPassword, verifyPassword } from './password.service';
import { logLoginAttempt } from './audit.service';
import {
  computeFingerprint,
  getClientIp,
  getUserAgent,
  upsertDeviceFingerprint
} from './device.service';
import { suspiciousLoginHook } from './suspicious-login.service';
import { isTwoFactorEnabled, verifyTwoFactor } from './two-factor.service';
import crypto from 'crypto';

export class AuthService {
  async login(formData: FormData, headers: Headers | HeadersInit) {
    const hdrs = headers instanceof Headers ? headers : new Headers(headers);
    const payload = Object.fromEntries(formData);
    const parsed = loginSchema.safeParse(payload);

    if (!parsed.success) {
      return { ok: false, errors: parsed.error.flatten().fieldErrors };
    }

    const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });

    if (!user || !user.password_hash) {
      return { ok: false, errors: { email: ['Invalid credentials'] } };
    }

    const passwordValid = await verifyPassword(parsed.data.password, user.password_hash);
    const ipAddress = getClientIp(hdrs);
    const userAgent = getUserAgent(hdrs);
    const fingerprint = computeFingerprint(hdrs);

    await logLoginAttempt({
      userId: user.id,
      ipAddress,
      userAgent,
      succeeded: passwordValid
    });

    if (!passwordValid) {
      return { ok: false, errors: { email: ['Invalid credentials'] } };
    }

    const twoFactorEnabled = await isTwoFactorEnabled(user.id);
    if (twoFactorEnabled) {
      const hasOtp = Boolean(parsed.data.otp);
      const hasRecovery = Boolean(parsed.data.recovery_code);
      if (!hasOtp && !hasRecovery) {
        return {
          ok: false,
          requiresOtp: true,
          message: 'Two-factor code is required',
          errors: { otp: ['2FA code required'] }
        };
      }

      const verified = await verifyTwoFactor({
        userId: user.id,
        token: parsed.data.otp,
        recoveryCode: parsed.data.recovery_code
      });

      if (!verified) {
        return {
          ok: false,
          requiresOtp: true,
          message: 'Invalid verification code or recovery code',
          errors: { otp: ['Invalid verification code'] }
        };
      }
    }

    await upsertDeviceFingerprint({
      userId: user.id,
      fingerprint,
      ipAddress,
      userAgent
    });

    await suspiciousLoginHook({
      userId: user.id,
      fingerprint,
      ipAddress,
      userAgent
    });

    return { ok: true, user };
  }

  async register(formData: FormData) {
    const payload = Object.fromEntries(formData);
    const parsed = registerSchema.safeParse(payload);

    if (!parsed.success) {
      return { ok: false, errors: parsed.error.flatten().fieldErrors };
    }

    const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
    if (existing) {
      return { ok: false, errors: { email: ['Email already registered'] } };
    }

    const passwordHash = await hashPassword(parsed.data.password);
    const user = await prisma.user.create({
      data: {
        id: crypto.randomUUID(),
        email: parsed.data.email,
        password_hash: passwordHash,
        role: 'USER',
        updated_at: new Date()
      }
    });

    return { ok: true, user };
  }
}
