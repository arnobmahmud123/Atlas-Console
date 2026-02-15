import { getServerSession } from 'next-auth';
import { authOptions } from '@/modules/auth/services/auth-options';
import { prisma } from '@/database/prisma/client';

function csvEscape(value: string) {
  if (value.includes('"') || value.includes(',') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    return new Response('Forbidden', { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') ?? 'all';
  const start = searchParams.get('start');
  const end = searchParams.get('end');

  const where =
    status === 'active'
      ? { is_active: true }
      : status === 'banned'
      ? { is_active: false }
      : status === 'unverified'
      ? { is_verified: false }
      : {};

  const created_at =
    start || end
      ? {
          ...(start ? { gte: new Date(start) } : {}),
          ...(end ? { lte: new Date(end) } : {})
        }
      : undefined;

  const users = await prisma.user.findMany({
    where: { ...where, ...(created_at ? { created_at } : {}) },
    orderBy: { created_at: 'desc' },
    select: { id: true, email: true, role: true, is_active: true, is_verified: true, created_at: true }
  });

  const header = ['id', 'email', 'role', 'is_active', 'is_verified', 'created_at'].join(',');
  const rows = users.map(u => [
    u.id,
    u.email,
    u.role,
    String(u.is_active),
    String(u.is_verified),
    u.created_at.toISOString()
  ].map(csvEscape).join(','));

  const csv = [header, ...rows].join('\n');

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="users.csv"'
    }
  });
}
