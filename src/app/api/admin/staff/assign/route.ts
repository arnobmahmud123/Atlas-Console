import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/modules/auth/services/auth-options';
import { prisma } from '@/database/prisma/client';
import crypto from 'crypto';
import { UserRole } from '@prisma/client';

const schema = z.object({
  userId: z.string().uuid(),
  role: z.string().min(1)
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, errors: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const builtInRoles: UserRole[] = ['ADMIN', 'STAFF', 'ACCOUNTANT'];
  const targetRole: UserRole = builtInRoles.includes(parsed.data.role as UserRole)
    ? (parsed.data.role as UserRole)
    : UserRole.STAFF;

  const user = await prisma.user.update({
    where: { id: parsed.data.userId },
    data: { role: targetRole }
  });

  if (!builtInRoles.includes(parsed.data.role as UserRole)) {
    const mapSetting = await prisma.siteSettings.findUnique({ where: { key: 'staff_role_map' } });
    const roleMap = (mapSetting?.value as Record<string, string>) ?? {};
    roleMap[parsed.data.userId] = parsed.data.role;
    const now = new Date();
    await prisma.siteSettings.upsert({
      where: { key: 'staff_role_map' },
      update: { value: roleMap, updated_at: now },
      create: { id: crypto.randomUUID(), key: 'staff_role_map', value: roleMap, updated_at: now }
    });
  }

  return NextResponse.json({ ok: true, user });
}
