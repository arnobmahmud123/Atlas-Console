import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/modules/auth/services/auth-options';
import { getSetting, setSetting } from '@/services/site-settings.service';
import crypto from 'crypto';
import { hashCctvPassword } from '@/lib/security/cctv-access';

const schema = z
  .object({
    enabled: z.boolean(),
    passwordRequired: z.boolean().default(false),
    channelId: z.string().trim().optional().or(z.literal('')),
    videoId: z.string().trim().optional().or(z.literal('')),
    accessPassword: z.string().trim().min(6).max(64).optional().or(z.literal(''))
  })
  .superRefine((data, ctx) => {
    const channelId = (data.channelId ?? '').trim();
    const videoId = (data.videoId ?? '').trim();
    if (data.enabled && !channelId && !videoId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Provide channel ID or video ID when stream is enabled',
        path: ['channelId']
      });
    }
  });

type CctvStoredSettings = {
  enabled?: boolean;
  passwordRequired?: boolean;
  channelId?: string;
  videoId?: string;
  passwordHash?: string;
  passwordSalt?: string;
  passwordUpdatedAt?: string;
};

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return NextResponse.json({ ok: false }, { status: 403 });
  }
  const setting = await getSetting('settings_cctv');
  const value = (setting?.value ?? null) as CctvStoredSettings | null;
  return NextResponse.json({
    ok: true,
    value: value
      ? {
          enabled: Boolean(value.enabled),
          passwordRequired: Boolean(value.passwordRequired),
          channelId: value.channelId ?? '',
          videoId: value.videoId ?? '',
          hasPassword: Boolean(value.passwordHash)
        }
      : null
  });
}

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, errors: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const existing = await getSetting('settings_cctv');
  const existingValue = (existing?.value ?? null) as CctvStoredSettings | null;
  const nextPassword = (parsed.data.accessPassword ?? '').trim();
  const hasExistingPassword = Boolean(existingValue?.passwordHash && existingValue?.passwordSalt);

  if (parsed.data.passwordRequired && !nextPassword && !hasExistingPassword) {
    return NextResponse.json(
      { ok: false, errors: { accessPassword: ['Set access password when password protection is enabled'] } },
      { status: 400 }
    );
  }

  let passwordHash = existingValue?.passwordHash ?? '';
  let passwordSalt = existingValue?.passwordSalt ?? '';
  let passwordUpdatedAt = existingValue?.passwordUpdatedAt ?? '';
  if (nextPassword) {
    passwordSalt = crypto.randomUUID();
    passwordHash = hashCctvPassword(nextPassword, passwordSalt);
    passwordUpdatedAt = new Date().toISOString();
  }

  const payload = {
    enabled: parsed.data.enabled,
    passwordRequired: parsed.data.passwordRequired,
    channelId: (parsed.data.channelId ?? '').trim(),
    videoId: (parsed.data.videoId ?? '').trim(),
    passwordHash,
    passwordSalt,
    passwordUpdatedAt
  };
  await setSetting('settings_cctv', payload);
  return NextResponse.json({
    ok: true,
    value: {
      enabled: payload.enabled,
      passwordRequired: payload.passwordRequired,
      channelId: payload.channelId,
      videoId: payload.videoId,
      hasPassword: Boolean(payload.passwordHash)
    }
  });
}
