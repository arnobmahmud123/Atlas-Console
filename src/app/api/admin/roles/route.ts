import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/modules/auth/services/auth-options';
import { prisma } from '@/database/prisma/client';
import crypto from 'crypto';

const schema = z.object({
  name: z.string().min(1),
  permissions: z.array(z.string()).min(1)
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return NextResponse.json({ ok: false }, { status: 403 });
  }
  const setting = await prisma.siteSettings.findUnique({ where: { key: 'custom_roles' } });
  return NextResponse.json({ ok: true, value: setting?.value ?? [] });
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

  const setting = await prisma.siteSettings.findUnique({ where: { key: 'custom_roles' } });
  const roles = (setting?.value as Array<{ name: string; permissions: string[] }>) ?? [];
  const idx = roles.findIndex(r => r.name === parsed.data.name);
  if (idx >= 0) {
    roles[idx] = parsed.data;
  } else {
    roles.push(parsed.data);
  }

  const now = new Date();
  await prisma.siteSettings.upsert({
    where: { key: 'custom_roles' },
    update: { value: roles, updated_at: now },
    create: { id: crypto.randomUUID(), key: 'custom_roles', value: roles, updated_at: now }
  });

  return NextResponse.json({ ok: true, value: roles });
}
