import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/modules/auth/services/auth-options';
import { prisma } from '@/database/prisma/client';
import { sanitizeString } from '@/lib/http/sanitize';

const querySchema = z.object({
  status: z.preprocess(
    value => {
      const sanitized = sanitizeString(value);
      return typeof sanitized === 'string' ? sanitized.toUpperCase() : sanitized;
    },
    z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional()
  )
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

  const where = parsed.data.status ? { status: parsed.data.status } : {};

  const kyc = await prisma.kyc.findMany({
    where,
    orderBy: { created_at: 'desc' },
    include: { User_Kyc_user_idToUser: { select: { email: true } } }
  });

  const data = kyc.map(item => ({
    ...item,
    User: item.User_Kyc_user_idToUser
  }));

  return NextResponse.json({ ok: true, data });
}
