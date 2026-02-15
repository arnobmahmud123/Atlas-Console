import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/modules/auth/services/auth-options';
import { prisma } from '@/database/prisma/client';
import { zSanitizedString } from '@/lib/http/sanitize';
import { z } from 'zod';
import { TransactionType } from '@prisma/client';

const querySchema = z.object({
  status: zSanitizedString().optional(),
  type: zSanitizedString().optional(),
  start: zSanitizedString().optional(),
  end: zSanitizedString().optional()
});

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  const parsed = zSanitizedString().uuid().safeParse(id);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, errors: { id: ['Invalid user id'] } }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const qp = querySchema.safeParse({
    status: searchParams.get('status') ?? undefined,
    type: searchParams.get('type') ?? undefined,
    start: searchParams.get('start') ?? undefined,
    end: searchParams.get('end') ?? undefined
  });

  if (!qp.success) {
    return NextResponse.json({ ok: false, errors: qp.error.flatten().fieldErrors }, { status: 400 });
  }

  const created_at =
    qp.data.start || qp.data.end
      ? {
          ...(qp.data.start ? { gte: new Date(qp.data.start) } : {}),
          ...(qp.data.end ? { lte: new Date(qp.data.end) } : {})
        }
      : undefined;

  const where = {
    user_id: id,
    ...(qp.data.status ? { status: qp.data.status } : {}),
    ...(qp.data.type && (Object.values(TransactionType) as string[]).includes(qp.data.type)
      ? { type: qp.data.type as TransactionType }
      : {}),
    ...(created_at ? { created_at } : {})
  };

  const transactions = await prisma.transaction.findMany({
    where,
    orderBy: { created_at: 'desc' },
    take: 50
  });

  return NextResponse.json({ ok: true, data: transactions });
}
