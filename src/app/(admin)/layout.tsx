import { getServerSession } from 'next-auth';
import { notFound } from 'next/navigation';
import { authOptions } from '@/modules/auth/services/auth-options';
import { AdminShell } from '@/ui/layout/admin-shell';
import { prisma } from '@/database/prisma/client';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== 'ADMIN') {
    notFound();
  }

  const profile = await prisma.userProfile.findUnique({
    where: { user_id: session.user.id },
    select: { full_name: true, avatar_url: true }
  });
  const now = new Date();
  const announcements = await prisma.announcement.findMany({
    where: {
      is_active: true,
      OR: [{ expires_at: null }, { expires_at: { gt: now } }]
    },
    orderBy: { published_at: 'desc' },
    select: {
      id: true,
      title: true,
      message: true,
      type: true,
      published_at: true
    },
    take: 20
  });

  return (
    <AdminShell
      userEmail={session.user.email ?? 'admin'}
      userName={profile?.full_name ?? null}
      avatarUrl={profile?.avatar_url ?? null}
      announcements={announcements.map(row => ({ ...row, published_at: row.published_at.toISOString() }))}
    >
      {children}
    </AdminShell>
  );
}
