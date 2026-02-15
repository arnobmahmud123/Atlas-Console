import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/modules/auth/services/auth-options';
import { prisma } from '@/database/prisma/client';
import { sanitizeString, zSanitizedString } from '@/lib/http/sanitize';
import { UserRole } from '@prisma/client';

const updateSchema = z.object({
  email: zSanitizedString().email(),
  role: z.preprocess(sanitizeString, z.enum([UserRole.ADMIN, UserRole.USER, UserRole.STAFF, UserRole.ACCOUNTANT])),
  isActive: z.boolean(),
  isVerified: z.boolean()
});

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, email: true, role: true, is_active: true, is_verified: true }
  });

  return NextResponse.json({ ok: true, user });
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  const body = await request.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, errors: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id },
    data: {
      email: parsed.data.email,
      role: parsed.data.role,
      is_active: parsed.data.isActive,
      is_verified: parsed.data.isVerified
    }
  });

  return NextResponse.json({ ok: true, user });
}
