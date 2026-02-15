import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/modules/auth/services/auth-options';
import { prisma } from '@/database/prisma/client';
import { z } from 'zod';
import { getPrismaMigrationMessage } from '@/lib/http/prisma-errors';

const idSchema = z.string().uuid();

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });

  const parsed = idSchema.safeParse(id);
  if (!parsed.success) return NextResponse.json({ ok: false, message: 'Invalid notification id' }, { status: 400 });

  try {
    const existing = await prisma.notification.findFirst({
      where: { id: parsed.data, user_id: session.user.id }
    });
    if (!existing) return NextResponse.json({ ok: false, message: 'Not found' }, { status: 404 });

    await prisma.notification.update({
      where: { id: parsed.data },
      data: { read: true }
    });

    return NextResponse.json({ ok: true, message: 'Marked as read.' });
  } catch (e: any) {
    const mapped = getPrismaMigrationMessage(e, 'Failed to mark notification as read');
    return NextResponse.json({ ok: false, message: mapped.message }, { status: mapped.status });
  }
}
