import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import crypto from 'crypto';
import { authOptions } from '@/modules/auth/services/auth-options';
import { prisma } from '@/database/prisma/client';
import { sanitizeString } from '@/lib/http/sanitize';

const schema = z.object({
  fullName: z.preprocess(sanitizeString, z.string().min(1).max(80)).optional(),
  phone: z.preprocess(sanitizeString, z.string().min(3).max(32)).optional(),
  address: z.preprocess(sanitizeString, z.string().min(3).max(160)).optional(),
  avatarUrl: z.preprocess(sanitizeString, z.string().min(3).max(300)).optional()
});

export async function PUT(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ ok: false, message: 'Invalid request body' }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, errors: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  try {
    const now = new Date();
    const profile = await prisma.userProfile.upsert({
      where: { user_id: session.user.id },
      update: {
        full_name: parsed.data.fullName,
        phone: parsed.data.phone,
        address: parsed.data.address,
        avatar_url: parsed.data.avatarUrl,
        updated_at: now
      },
      create: {
        id: crypto.randomUUID(),
        user_id: session.user.id,
        full_name: parsed.data.fullName,
        phone: parsed.data.phone,
        address: parsed.data.address,
        avatar_url: parsed.data.avatarUrl,
        updated_at: now
      }
    });

    return NextResponse.json({ ok: true, message: 'Profile updated', profile });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Failed to update profile';
    // Common local dev failure if migration wasn't applied yet.
    const hint = msg.toLowerCase().includes('userprofile') || msg.toLowerCase().includes('user_profile')
      ? 'Profile table missing. Run: npx prisma migrate dev'
      : null;
    return NextResponse.json({ ok: false, message: hint ?? msg }, { status: 500 });
  }
}
