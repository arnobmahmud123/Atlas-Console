import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import crypto from 'crypto';
import { authOptions } from '@/modules/auth/services/auth-options';
import { prisma } from '@/database/prisma/client';

const schema = z.object({ message: z.string().trim().min(1).max(4000) });

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, errors: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const ticket = await prisma.supportTicket.findUnique({ where: { id }, select: { id: true, user_id: true, status: true } });
  if (!ticket || ticket.user_id !== session.user.id) {
    return NextResponse.json({ ok: false, message: 'Not found' }, { status: 404 });
  }
  if (ticket.status === 'CLOSED') {
    return NextResponse.json({ ok: false, message: 'Ticket is closed' }, { status: 400 });
  }

  const now = new Date();
  await prisma.$transaction([
    prisma.supportTicketReply.create({
      data: {
        id: crypto.randomUUID(),
        ticket_id: id,
        author_id: session.user.id,
        message: parsed.data.message,
        is_admin: false,
        updated_at: now
      }
    }),
    prisma.supportTicket.update({ where: { id }, data: { status: 'OPEN', updated_at: now } })
  ]);

  return NextResponse.json({ ok: true, message: 'Reply sent' });
}
