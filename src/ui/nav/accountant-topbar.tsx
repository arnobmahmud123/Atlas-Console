'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ProfileMenu } from '@/ui/components/profile-menu';
import { NotificationsButton } from '@/ui/components/notifications-button';
import { accountantNavItems } from '@/ui/nav/accountant-nav-items';

export function AccountantTopbar(props: { userEmail?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <header className="bg-card-navy ui-surface relative z-50 flex h-16 items-center justify-between px-6">
      <div>
        <p className="text-xs text-slate-400">Operations overview</p>
        <p className="text-sm font-semibold text-white">Review queue</p>
      </div>
      <button
        className="bg-card-indigo ui-surface rounded-md px-3 py-1 text-xs text-slate-200 hover:text-white lg:hidden"
        type="button"
        onClick={() => setOpen(!open)}
      >
        Menu
      </button>
      <div className="hidden items-center gap-3 lg:flex">
        <NotificationsButton viewAllHref="/dashboard/notifications" />
        <ProfileMenu profileHref="/dashboard/profile" email={props.userEmail} name={null} avatarUrl={null} />
      </div>
      {open && (
        <div className="bg-card-navy ui-surface absolute left-4 right-4 top-16 z-50 rounded-2xl p-4 shadow-lg lg:hidden">
          <div className="grid gap-2 text-sm text-slate-300">
            {accountantNavItems.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-md px-3 py-2 hover:bg-white/10 hover:text-white"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
