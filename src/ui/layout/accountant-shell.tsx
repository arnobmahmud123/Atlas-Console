import { AccountantSidebar } from '@/ui/nav/accountant-sidebar';
import { AccountantTopbar } from '@/ui/nav/accountant-topbar';
import { AnnouncementPopup } from '@/ui/components/announcement-popup';

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
        <main className="flex-1 px-6 py-6">{props.children}</main>
      </div>
    </div>
  );
}
