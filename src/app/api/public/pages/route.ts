import { NextResponse } from 'next/server';
import { prisma } from '@/database/prisma/client';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug');

  const setting = await prisma.siteSettings.findUnique({ where: { key: 'cms_pages' } });
  const pages = (setting?.value as Array<{ slug: string; title: string; content: string }>) ?? [];

  if (slug) {
    const page = pages.find(p => p.slug === slug);
    return NextResponse.json({ ok: true, page: page ?? null });
  }

  return NextResponse.json({ ok: true, pages });
}
