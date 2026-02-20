import { getServerSession } from 'next-auth';
import { notFound } from 'next/navigation';
import { authOptions } from '@/modules/auth/services/auth-options';
import { AccountantShell } from '@/ui/layout/accountant-shell';

export default async function AccountantLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) notFound();
  if (session.user.role !== 'ACCOUNTANT' && session.user.role !== 'ADMIN') notFound();

  return (
    <AccountantShell
      userEmail={session.user.email ?? 'accountant'}
      announcements={[]}
    >
      {children}
    </AccountantShell>
  );
}
