import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/modules/auth/services/auth-options';
import { prisma } from '@/database/prisma/client';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  const accounts = await prisma.ledgerAccount.findMany({
    orderBy: { account_no: 'asc' },
    include: {
      User: { select: { email: true, role: true } },
      Wallet: { select: { name: true, type: true, currency: true } }
    },
    take: 200
  });

  return NextResponse.json({ ok: true, data: accounts });
}
