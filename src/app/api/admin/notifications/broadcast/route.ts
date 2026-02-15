import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/modules/auth/services/auth-options';
import { prisma } from '@/database/prisma/client';
import crypto from 'crypto';

const schema = z.object({
  title: z.string().min(1),
  message: z.string().min(1)
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, errors: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const users = await prisma.user.findMany({
    where: { is_active: true },
    select: { id: true }
  });

  await prisma.notification.createMany({
    data: users.map(u => ({
      id: crypto.randomUUID(),
      user_id: u.id,
      type: 'INFO',
      title: parsed.data.title,
      message: parsed.data.message
    }))
  });

  return NextResponse.json({ ok: true, count: users.length });
}
