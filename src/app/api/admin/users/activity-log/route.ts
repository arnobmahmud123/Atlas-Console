import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/modules/auth/services/auth-options';
import { prisma } from '@/database/prisma/client';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  const logs = await prisma.userActivityLog.findMany({
    orderBy: { created_at: 'desc' },
    take: 100,
    include: { User: { select: { email: true } } }
  });

  return NextResponse.json({ ok: true, data: logs });
}
