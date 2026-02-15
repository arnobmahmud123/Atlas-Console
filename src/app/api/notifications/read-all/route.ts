import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/modules/auth/services/auth-options';
import { prisma } from '@/database/prisma/client';
import { getPrismaMigrationMessage } from '@/lib/http/prisma-errors';

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });

  try {
    const out = await prisma.notification.updateMany({
      where: { user_id: session.user.id, read: false },
      data: { read: true }
    });

    return NextResponse.json({ ok: true, message: 'Marked all as read.', count: out.count });
  } catch (e: any) {
    const mapped = getPrismaMigrationMessage(e, 'Failed to mark notifications as read');
    return NextResponse.json({ ok: false, message: mapped.message }, { status: mapped.status });
  }
}
