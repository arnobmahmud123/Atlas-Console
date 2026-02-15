import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { DashboardShell } from '@/ui/layout/dashboard-shell';
import { authOptions } from '@/modules/auth/services/auth-options';
import { prisma } from '@/database/prisma/client';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/login');
  }

  if (session.user.role === 'ADMIN') {
    redirect('/admin/dashboard');
  }
  if (session.user.role === 'ACCOUNTANT') {
    redirect('/accountant/dashboard');
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
    <DashboardShell
      userEmail={session?.user?.email ?? 'user'}
      userName={profile?.full_name ?? null}
      avatarUrl={profile?.avatar_url ?? null}
      announcements={announcements.map(row => ({ ...row, published_at: row.published_at.toISOString() }))}
    >
      {children}
    </DashboardShell>
  );
}
