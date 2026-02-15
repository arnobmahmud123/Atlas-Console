import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/modules/auth/services/auth-options';
import { prisma } from '@/database/prisma/client';
import crypto from 'crypto';

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  await prisma.impersonationToken.create({
    data: {
      id: crypto.randomUUID(),
      token,
      user_id: id,
      created_by: session.user.id,
      expires_at: expiresAt
    }
  });

  return NextResponse.json({ ok: true, url: `/api/auth/impersonate?token=${token}` });
}
