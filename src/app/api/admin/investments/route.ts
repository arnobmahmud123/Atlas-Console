import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/modules/auth/services/auth-options';
import { prisma } from '@/database/prisma/client';
import { zSanitizedString } from '@/lib/http/sanitize';
import { InvestmentStatus } from '@prisma/client';

const querySchema = z.object({
  status: zSanitizedString().optional()
});

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({ status: searchParams.get('status') ?? undefined });
  if (!parsed.success) {
    return NextResponse.json({ ok: false, errors: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const status =
    parsed.data.status && (Object.values(InvestmentStatus) as string[]).includes(parsed.data.status)
      ? (parsed.data.status as InvestmentStatus)
      : undefined;

  const where = status ? { status } : {};

  const investments = await prisma.investmentPosition.findMany({
    where,
    orderBy: { start_date: 'desc' },
    include: { User: { select: { email: true } }, InvestmentPlan: { select: { name: true } } },
    take: 100
  });

  return NextResponse.json({ ok: true, data: investments });
}
