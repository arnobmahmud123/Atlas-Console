import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/modules/auth/services/auth-options';
import { prisma } from '@/database/prisma/client';
import crypto from 'crypto';

const schema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  content: z.string().min(1)
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return NextResponse.json({ ok: false }, { status: 403 });
  }
  const setting = await prisma.siteSettings.findUnique({ where: { key: 'cms_pages' } });
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

  const setting = await prisma.siteSettings.findUnique({ where: { key: 'cms_pages' } });
  const pages = (setting?.value as Array<{ slug: string; title: string; content: string }>) ?? [];
  const idx = pages.findIndex(p => p.slug === parsed.data.slug);
  if (idx >= 0) {
    pages[idx] = parsed.data;
  } else {
    pages.push(parsed.data);
  }

  const now = new Date();
  await prisma.siteSettings.upsert({
    where: { key: 'cms_pages' },
    update: { value: pages, updated_at: now },
    create: { id: crypto.randomUUID(), key: 'cms_pages', value: pages, updated_at: now }
  });

  return NextResponse.json({ ok: true, value: pages });
}
