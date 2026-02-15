'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ThemeToggle } from '@/ui/components/theme-toggle';
import { navItems } from '@/ui/nav/sidebar';
import { ProfileMenu } from '@/ui/components/profile-menu';
import { NotificationsButton } from '@/ui/components/notifications-button';

export function Topbar(props: { userEmail?: string; userName?: string | null; avatarUrl?: string | null }) {
  const [open, setOpen] = useState(false);

  return (
    <header className="bg-card-navy ui-surface relative z-50 flex h-16 items-center justify-between px-6">
      <div className="text-sm font-semibold text-white">Dashboard</div>
      <button
        className="bg-card-indigo ui-surface rounded-md px-3 py-1 text-xs text-slate-300 hover:text-white lg:hidden"
        type="button"
        onClick={() => setOpen(!open)}
      >
        Menu
      </button>
      <div className="flex items-center gap-3">
        <div className="hidden lg:block">
          <NotificationsButton viewAllHref="/dashboard/notifications" />
        </div>
        <ThemeToggle />
        <ProfileMenu
          profileHref="/dashboard/profile"
          email={props.userEmail}
          name={props.userName ?? null}
          avatarUrl={props.avatarUrl ?? null}
        />
      </div>
      {open && (
        <div className="bg-card-navy ui-surface absolute left-4 right-4 top-16 z-50 rounded-2xl p-4 shadow-lg lg:hidden">
          <div className="grid gap-2 text-sm text-slate-300">
            {navItems.map(item => (
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
