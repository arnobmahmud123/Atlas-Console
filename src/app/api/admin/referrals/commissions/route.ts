import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/modules/auth/services/auth-options';
import { prisma } from '@/database/prisma/client';
import crypto from 'crypto';

const schema = z.object({
  levels: z.array(z.object({ level: z.number().int().min(1), percent: z.number().min(0) }))
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  const setting = await prisma.siteSettings.findUnique({ where: { key: 'referral_commissions' } });
  return NextResponse.json({ ok: true, value: setting?.value ?? { levels: [] } });
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

  const value = { levels: parsed.data.levels };
  const now = new Date();
  await prisma.siteSettings.upsert({
    where: { key: 'referral_commissions' },
    update: { value, updated_at: now },
    create: { id: crypto.randomUUID(), key: 'referral_commissions', value, updated_at: now }
  });

  return NextResponse.json({ ok: true, value });
}
