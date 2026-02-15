import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/modules/auth/services/auth-options';
import { prisma } from '@/database/prisma/client';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });
  }

  const data = await prisma.documentCenterItem.findMany({
    where: { is_active: true },
    orderBy: [{ category: 'asc' }, { created_at: 'desc' }],
    select: {
      id: true,
      title: true,
      category: true,
      file_url: true,
      notes: true,
      created_at: true
    }
  });

  return NextResponse.json({ ok: true, data });
}
