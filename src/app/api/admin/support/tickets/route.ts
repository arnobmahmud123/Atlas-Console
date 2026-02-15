import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/modules/auth/services/auth-options';
import { prisma } from '@/database/prisma/client';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return NextResponse.json({ ok: false, message: 'Forbidden' }, { status: 403 });
  }

  const url = new URL(request.url);
  const status = url.searchParams.get('status');

  const data = await prisma.supportTicket.findMany({
    where: status ? { status: status as any } : undefined,
    orderBy: { created_at: 'desc' },
    include: {
      User: { select: { email: true } },
      replies: {
        orderBy: { created_at: 'asc' },
        include: { author: { select: { email: true } } }
      }
    }
  });

  return NextResponse.json({ ok: true, data });
}
