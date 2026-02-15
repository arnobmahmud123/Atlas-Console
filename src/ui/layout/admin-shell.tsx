import { AdminSidebar } from '@/ui/nav/admin-sidebar';
import { AdminTopbar } from '@/ui/nav/admin-topbar';
import { AnnouncementPopup } from '@/ui/components/announcement-popup';

export function AdminShell(props: {
  children: React.ReactNode;
  userEmail?: string;
  userName?: string | null;
  avatarUrl?: string | null;
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
      <AdminSidebar />
      <div className="flex min-h-screen flex-1 flex-col">
        <AdminTopbar userEmail={props.userEmail} userName={props.userName} avatarUrl={props.avatarUrl} />
        <main className="flex-1 px-6 py-6">{props.children}</main>
      </div>
    </div>
  );
}
