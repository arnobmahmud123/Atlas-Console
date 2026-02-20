import { AccountantSidebar } from '@/ui/nav/accountant-sidebar';
import { AccountantTopbar } from '@/ui/nav/accountant-topbar';
import { AnnouncementPopup } from '@/ui/components/announcement-popup';
import Link from 'next/link';
import { accountantNavItems } from '@/ui/nav/accountant-sidebar';

export function AccountantShell(props: {
  children: React.ReactNode;
  userEmail?: string;
  announcements?: Array<{
    id: string;
    title: string;
    message: string;
    type: 'GENERAL' | 'PROFIT_DELAY' | 'MAINTENANCE';
    published_at: string;
  }>;
}) {
  return (
    <div className="bg-enterprise-header flex min-h-screen">
      <AnnouncementPopup initialAnnouncements={props.announcements} />
      <AccountantSidebar />
      <div className="flex min-h-screen flex-1 flex-col">
        <AccountantTopbar userEmail={props.userEmail} />
        <main className="flex-1 px-6 py-6 pb-20 lg:pb-6">{props.children}</main>
        <nav className="bg-card-navy ui-surface fixed inset-x-0 bottom-0 z-50 flex gap-2 overflow-x-auto border-t border-white/10 px-3 py-2 lg:hidden">
          {accountantNavItems.map(item => (
            <Link key={item.href} href={item.href} className="whitespace-nowrap rounded-full border border-white/10 px-3 py-1.5 text-xs text-slate-200">
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
