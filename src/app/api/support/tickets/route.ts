import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import crypto from 'crypto';
import { authOptions } from '@/modules/auth/services/auth-options';
import { prisma } from '@/database/prisma/client';
import { sendNotification } from '@/services/notification.service';

const createSchema = z.object({
  subject: z.string().trim().min(3).max(200),
  message: z.string().trim().min(3).max(4000)
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
  }

  const data = await prisma.supportTicket.findMany({
    where: { user_id: session.user.id },
    orderBy: { created_at: 'desc' },
    include: {
      replies: {
        orderBy: { created_at: 'asc' },
        include: { author: { select: { email: true } } }
      }
    }
  });

  return NextResponse.json({ ok: true, data });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, errors: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const now = new Date();
  const created = await prisma.supportTicket.create({
    data: {
      id: crypto.randomUUID(),
      user_id: session.user.id,
      subject: parsed.data.subject,
      message: parsed.data.message,
      status: 'OPEN',
      updated_at: now,
      replies: {
        create: {
          id: crypto.randomUUID(),
          author_id: session.user.id,
          message: parsed.data.message,
          is_admin: false,
          updated_at: now
        }
      }
    }
  });

  const admins = await prisma.user.findMany({
    where: { role: 'ADMIN', is_active: true },
    select: { id: true }
  });
  await Promise.all(
    admins.map(admin =>
      sendNotification(
        admin.id,
        'INFO',
        'New support ticket',
        `A new ticket was created: ${parsed.data.subject}`,
        { href: '/admin/support' }
      )
    )
  );

  return NextResponse.json({ ok: true, data: created, message: 'Ticket created' });
}
