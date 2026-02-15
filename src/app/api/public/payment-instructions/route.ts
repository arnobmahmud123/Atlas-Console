import { NextResponse } from 'next/server';
import { prisma } from '@/database/prisma/client';

export async function GET() {
  // Defaults are fine for local dev; admin can override via SiteSettings later.
  const [bkash, nagad] = await Promise.all([
    prisma.siteSettings.findUnique({ where: { key: 'bkash_number' }, select: { value: true } }).catch(() => null),
    prisma.siteSettings.findUnique({ where: { key: 'nagad_number' }, select: { value: true } }).catch(() => null)
  ]);

  return NextResponse.json({
    ok: true,
    bkashNumber: (bkash?.value as any)?.number ?? '01XXXXXXXXX',
    nagadNumber: (nagad?.value as any)?.number ?? '01XXXXXXXXX'
  });
}

