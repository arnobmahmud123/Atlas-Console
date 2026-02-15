import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/modules/auth/services/auth-options';
import { prisma } from '@/database/prisma/client';
import crypto from 'crypto';

const schema = z.object({
  breadcrumbImageUrl: z.string().min(1),
  maintenanceBanner: z.string().min(1),
  supportEmail: z.string().email()
});

const key = 'page_settings';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return NextResponse.json({ ok: false }, { status: 403 });
  }
  const setting = await prisma.siteSettings.findUnique({ where: { key } });
  return NextResponse.json({ ok: true, value: setting?.value ?? null });
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
  const now = new Date();
  await prisma.siteSettings.upsert({
    where: { key },
    update: { value: parsed.data, updated_at: now },
    create: { id: crypto.randomUUID(), key, value: parsed.data, updated_at: now }
  });
  return NextResponse.json({ ok: true });
}
