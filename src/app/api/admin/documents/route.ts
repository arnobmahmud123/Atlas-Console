import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/modules/auth/services/auth-options';
import { prisma } from '@/database/prisma/client';
import crypto from 'crypto';

const createSchema = z.object({
  title: z.string().trim().min(2).max(120),
  category: z.enum(['BUSINESS_LICENSE', 'SHOP_LEASE', 'TAX_FILE', 'OTHER']),
  fileUrl: z.string().url(),
  notes: z.string().trim().max(1000).optional().or(z.literal(''))
});

const updateSchema = z.object({
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

  const data = await prisma.documentCenterItem.findMany({
    orderBy: { created_at: 'desc' },
    include: { UploadedBy: { select: { email: true } } }
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
  const created = await prisma.documentCenterItem.create({
    data: {
      id: crypto.randomUUID(),
      title: parsed.data.title,
      category: parsed.data.category,
      file_url: parsed.data.fileUrl,
      notes: parsed.data.notes?.trim() || null,
      uploaded_by: session.user.id,
      updated_at: now
    }
  });

  return NextResponse.json({ ok: true, data: created, message: 'Document uploaded' });
}

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !isAdmin(session.user.role)) {
    return NextResponse.json({ ok: false, message: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, errors: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const updated = await prisma.documentCenterItem.update({
    where: { id: parsed.data.id },
    data: { is_active: parsed.data.isActive, updated_at: new Date() }
  });

  return NextResponse.json({ ok: true, data: updated, message: 'Document status updated' });
}
