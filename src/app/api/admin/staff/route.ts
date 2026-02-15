import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/modules/auth/services/auth-options';
import { prisma } from '@/database/prisma/client';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    select: { id: true, email: true, role: true }
  });

  const mapSetting = await prisma.siteSettings.findUnique({ where: { key: 'staff_role_map' } });
  const roleMap = (mapSetting?.value as Record<string, string>) ?? {};

  const data = users.map(u => ({ ...u, customRole: roleMap[u.id] ?? null }));

  return NextResponse.json({ ok: true, data });
}
