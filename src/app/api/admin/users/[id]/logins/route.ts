import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/modules/auth/services/auth-options';
import { prisma } from '@/database/prisma/client';
import { zSanitizedString } from '@/lib/http/sanitize';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  const parsed = zSanitizedString().uuid().safeParse(id);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, errors: { id: ['Invalid user id'] } }, { status: 400 });
  }

  const logins = await prisma.loginHistory.findMany({
    where: { user_id: id },
    orderBy: { created_at: 'desc' },
    take: 25
  });

  return NextResponse.json({ ok: true, data: logins });
}
