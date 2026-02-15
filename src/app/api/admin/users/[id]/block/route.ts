import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/modules/auth/services/auth-options';
import { prisma } from '@/database/prisma/client';
import { z } from 'zod';
import { zSanitizedString } from '@/lib/http/sanitize';

const bodySchema = z.object({
  isActive: z.boolean()
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  const paramParsed = zSanitizedString().uuid().safeParse(id);
  if (!paramParsed.success) {
    return NextResponse.json({ ok: false, errors: { id: ['Invalid user id'] } }, { status: 400 });
  }

  const body = await request.json();
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, errors: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id },
    data: { is_active: parsed.data.isActive }
  });

  return NextResponse.json({ ok: true, user });
}
