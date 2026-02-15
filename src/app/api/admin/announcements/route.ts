import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import crypto from 'crypto';
import { authOptions } from '@/modules/auth/services/auth-options';
import { prisma } from '@/database/prisma/client';

const createSchema = z.object({
  title: z.string().trim().min(3).max(160),
  message: z.string().trim().min(3).max(4000),
  type: z.enum(['GENERAL', 'PROFIT_DELAY', 'MAINTENANCE']),
  isActive: z.boolean().default(true),
  expiresAt: z.string().datetime().optional().or(z.literal(''))
});

const toggleSchema = z.object({
  id: z.string().uuid(),
  isActive: z.boolean()
});

function isAdmin(role?: string) {
  return role === 'ADMIN';
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !isAdmin(session.user.role)) {
    return NextResponse.json({ ok: false, message: 'Forbidden' }, { status: 403 });
  }

  const data = await prisma.announcement.findMany({
    orderBy: { published_at: 'desc' },
    include: { CreatedBy: { select: { email: true } } },
    take: 200
  });
  return NextResponse.json({ ok: true, data });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !isAdmin(session.user.role)) {
    return NextResponse.json({ ok: false, message: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, errors: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const now = new Date();
  const created = await prisma.announcement.create({
    data: {
      id: crypto.randomUUID(),
      title: parsed.data.title,
      message: parsed.data.message,
      type: parsed.data.type,
      is_active: parsed.data.isActive,
      published_at: now,
      expires_at: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null,
      created_by: session.user.id,
      updated_at: now
    }
  });

  return NextResponse.json({ ok: true, data: created, message: 'Announcement posted' });
}

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !isAdmin(session.user.role)) {
    return NextResponse.json({ ok: false, message: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = toggleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, errors: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const updated = await prisma.announcement.update({
    where: { id: parsed.data.id },
    data: { is_active: parsed.data.isActive, updated_at: new Date() }
  });

  return NextResponse.json({ ok: true, data: updated, message: 'Announcement status updated' });
}
