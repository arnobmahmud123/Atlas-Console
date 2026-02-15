import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/modules/auth/services/auth-options';
import { prisma } from '@/database/prisma/client';
import { zSanitizedString } from '@/lib/http/sanitize';

const SYSTEM_ACCOUNT_NOS = ['1000', '2000'] as const;

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return NextResponse.json({ ok: false, message: 'Forbidden' }, { status: 403 });
  }

  const parsed = zSanitizedString().uuid().safeParse(id);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, errors: { id: ['Invalid user id'] } }, { status: 400 });
  }

  const accounts = await prisma.ledgerAccount.findMany({
    where: {
      OR: [
        { user_id: id, deleted_at: null },
        { account_no: { in: [...SYSTEM_ACCOUNT_NOS] }, deleted_at: null }
      ]
    },
    orderBy: { account_no: 'asc' },
    include: { User: { select: { email: true, role: true } }, Wallet: { select: { name: true, type: true } } }
  });

  return NextResponse.json({ ok: true, data: accounts });
}
