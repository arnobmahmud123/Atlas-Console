import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/modules/auth/services/auth-options';
import { prisma } from '@/database/prisma/client';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const plans = await prisma.investmentPlan.findMany({
    where: { is_active: true, deleted_at: null }
  });

  return NextResponse.json({ ok: true, plans });
}
