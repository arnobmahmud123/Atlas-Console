import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/modules/auth/services/auth-options';
import { prisma } from '@/database/prisma/client';
import { zSanitizedString } from '@/lib/http/sanitize';
import { TransactionType } from '@prisma/client';

const querySchema = z.object({
  status: zSanitizedString().optional(),
  type: zSanitizedString().optional(),
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
    type: searchParams.get('type') ?? undefined,
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

  const type =
    parsed.data.type && (Object.values(TransactionType) as string[]).includes(parsed.data.type)
      ? (parsed.data.type as TransactionType)
      : undefined;

  const transactions = await prisma.transaction.findMany({
    where: {
      ...(parsed.data.status ? { status: parsed.data.status } : {}),
      ...(type ? { type } : {}),
      ...(created_at ? { created_at } : {}),
      ...(parsed.data.email ? { User: { email: { contains: parsed.data.email, mode: 'insensitive' } } } : {})
    },
    orderBy: { created_at: 'desc' },
    include: { User: { select: { email: true } } },
    take: 200
  });

  return NextResponse.json({ ok: true, data: transactions });
}
