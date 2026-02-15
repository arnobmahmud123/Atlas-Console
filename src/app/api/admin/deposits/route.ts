import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/modules/auth/services/auth-options';
import { prisma } from '@/database/prisma/client';
import { zSanitizedString } from '@/lib/http/sanitize';
import { DepositStatus } from '@prisma/client';

const querySchema = z.object({
  status: zSanitizedString().optional(),
  email: zSanitizedString().optional(),
  start: zSanitizedString().optional(),
  end: zSanitizedString().optional()
});

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({
    status: searchParams.get('status') ?? undefined,
    email: searchParams.get('email') ?? undefined,
    start: searchParams.get('start') ?? undefined,
    end: searchParams.get('end') ?? undefined
  });

  if (!parsed.success) {
    return NextResponse.json({ ok: false, errors: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const created_at =
    parsed.data.start || parsed.data.end
      ? {
          ...(parsed.data.start ? { gte: new Date(parsed.data.start) } : {}),
          ...(parsed.data.end ? { lte: new Date(parsed.data.end) } : {})
        }
      : undefined;

  const status =
    parsed.data.status && (Object.values(DepositStatus) as string[]).includes(parsed.data.status)
      ? (parsed.data.status as DepositStatus)
      : undefined;

  const deposits = await prisma.deposit.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(created_at ? { created_at } : {}),
      ...(parsed.data.email ? { User: { email: { contains: parsed.data.email, mode: 'insensitive' } } } : {})
    },
    orderBy: { created_at: 'desc' },
    include: { User: { select: { email: true } } },
    take: 200
  });

  return NextResponse.json({ ok: true, data: deposits });
}
