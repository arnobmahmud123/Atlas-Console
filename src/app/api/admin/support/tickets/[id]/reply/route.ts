import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import crypto from 'crypto';
import { authOptions } from '@/modules/auth/services/auth-options';
import { prisma } from '@/database/prisma/client';

const schema = z.object({ message: z.string().trim().min(1).max(4000) });

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return NextResponse.json({ ok: false, message: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, errors: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const ticket = await prisma.supportTicket.findUnique({ where: { id }, select: { id: true } });
  if (!ticket) {
    return NextResponse.json({ ok: false, message: 'Not found' }, { status: 404 });
  }

  const now = new Date();
  await prisma.$transaction([
    prisma.supportTicketReply.create({
      data: {
        id: crypto.randomUUID(),
        ticket_id: id,
        author_id: session.user.id,
        message: parsed.data.message,
        is_admin: true,
        updated_at: now
      }
    }),
    prisma.supportTicket.update({ where: { id }, data: { status: 'IN_PROGRESS', updated_at: now } })
  ]);

  return NextResponse.json({ ok: true, message: 'Reply sent' });
}
