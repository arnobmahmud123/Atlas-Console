import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/modules/auth/services/auth-options';
import { prisma } from '@/database/prisma/client';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const positions = await prisma.investmentPosition.findMany({
    where: { user_id: session.user.id },
    include: { InvestmentPlan: true }
  });

  return NextResponse.json({ ok: true, positions });
}
