import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/modules/auth/services/auth-options';
import { prisma } from '@/database/prisma/client';
import { getPrismaMigrationMessage } from '@/lib/http/prisma-errors';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ ok: false, message: 'Unauthorized' }, { status: 401 });

  try {
    const rows = await prisma.referralCommission.findMany({
      where: { upline_user_id: session.user.id },
      orderBy: { created_at: 'desc' },
      include: {
        downline_user: { select: { email: true } },
        event: { select: { source_type: true, source_id: true } }
      },
      take: 300
    });

    const total = await prisma.referralCommission.aggregate({
      where: { upline_user_id: session.user.id },
      _sum: { amount: true }
    });

    return NextResponse.json({
      ok: true,
      totalEarnings: total._sum.amount?.toString() ?? '0',
      data: rows
    });
  } catch (e: any) {
    const mapped = getPrismaMigrationMessage(e, 'Failed to load referral commissions');
    return NextResponse.json({ ok: false, message: mapped.message }, { status: mapped.status });
  }
}
