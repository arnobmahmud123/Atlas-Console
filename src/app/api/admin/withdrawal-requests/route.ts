import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/modules/auth/services/auth-options';
import { prisma } from '@/database/prisma/client';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ ok: false }, { status: 401 });
  if (session.user.role !== 'ADMIN') return NextResponse.json({ ok: false }, { status: 403 });

  const url = new URL(request.url);
  const status = url.searchParams.get('status') ?? 'PENDING_ADMIN_FINAL';

  const data = await prisma.withdrawalRequest.findMany({
    where: { status: status as any },
    orderBy: { created_at: 'asc' },
    take: 200,
    include: { User: { select: { email: true } } }
  });
  return NextResponse.json({ ok: true, data });
}

