import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/modules/auth/services/auth-options';
import { prisma } from '@/database/prisma/client';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const data = await prisma.announcement.findMany({
    where: {
      is_active: true,
      OR: [{ expires_at: null }, { expires_at: { gt: now } }]
    },
    orderBy: { published_at: 'desc' },
    select: {
      id: true,
      title: true,
      message: true,
      type: true,
      published_at: true,
      expires_at: true
    },
    take: 20
  });

  return NextResponse.json({ ok: true, data });
}
