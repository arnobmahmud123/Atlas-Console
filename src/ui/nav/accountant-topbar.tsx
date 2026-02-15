'use client';

import { ProfileMenu } from '@/ui/components/profile-menu';
import { NotificationsButton } from '@/ui/components/notifications-button';

export function AccountantTopbar(props: { userEmail?: string }) {
  return (
    <header className="bg-card-navy ui-surface relative z-50 flex h-16 items-center justify-between px-6">
      <div>
        <p className="text-xs text-slate-400">Operations overview</p>
        <p className="text-sm font-semibold text-white">Review queue</p>
      </div>
      <div className="flex items-center gap-3">
        <NotificationsButton viewAllHref="/dashboard/notifications" />
        <ProfileMenu profileHref="/dashboard/profile" email={props.userEmail} name={null} avatarUrl={null} />
      </div>
    </header>
  );
}
