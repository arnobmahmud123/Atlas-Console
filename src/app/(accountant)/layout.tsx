import { getServerSession } from 'next-auth';
import { notFound } from 'next/navigation';
import { authOptions } from '@/modules/auth/services/auth-options';
import { AccountantShell } from '@/ui/layout/accountant-shell';
import { prisma } from '@/database/prisma/client';

export default async function AccountantLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) notFound();
  if (session.user.role !== 'ACCOUNTANT' && session.user.role !== 'ADMIN') notFound();

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
    <AccountantShell
      userEmail={session.user.email ?? 'accountant'}
      announcements={announcements.map(row => ({ ...row, published_at: row.published_at.toISOString() }))}
    >
      {children}
    </AccountantShell>
  );
}
