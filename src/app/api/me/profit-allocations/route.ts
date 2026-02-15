import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/modules/auth/services/auth-options';
import { prisma } from '@/database/prisma/client';
import { getPrismaMigrationMessage } from '@/lib/http/prisma-errors';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });

  try {
    const data = await prisma.profitAllocation.findMany({
      where: { user_id: session.user.id },
      orderBy: { created_at: 'desc' },
      include: {
        batch: {
          select: {
            id: true,
            period_type: true,
            period_start: true,
            period_end: true,
            status: true
          }
        }
      },
      take: 200
    });

    return NextResponse.json({ ok: true, data });
  } catch (e: any) {
    const mapped = getPrismaMigrationMessage(e, 'Failed to load profit allocations');
    return NextResponse.json({ ok: false, message: mapped.message }, { status: mapped.status });
  }
}
