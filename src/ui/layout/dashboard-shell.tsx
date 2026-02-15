import { Sidebar } from '@/ui/nav/sidebar';
import { Topbar } from '@/ui/nav/topbar';
import { AnnouncementPopup } from '@/ui/components/announcement-popup';

export function DashboardShell(props: {
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
      <Sidebar />
      <div className="flex min-h-screen flex-1 flex-col">
        <Topbar userEmail={props.userEmail} userName={props.userName} avatarUrl={props.avatarUrl} />
        <main className="flex-1 px-6 py-6">{props.children}</main>
      </div>
    </div>
  );
}
