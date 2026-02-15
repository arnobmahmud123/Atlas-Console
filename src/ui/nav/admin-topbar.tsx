'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ThemeToggle } from '@/ui/components/theme-toggle';
import { adminNavItems } from '@/ui/nav/admin-sidebar';
import { ProfileMenu } from '@/ui/components/profile-menu';
import { NotificationsButton } from '@/ui/components/notifications-button';

export function AdminTopbar(props: { userEmail?: string; userName?: string | null; avatarUrl?: string | null }) {
  const [open, setOpen] = useState(false);

  return (
    <header className="bg-card-navy ui-surface relative z-50 flex h-16 items-center justify-between px-6">
      <div className="flex items-center gap-3">
        <div className="bg-card-accent ui-surface flex h-8 w-8 items-center justify-center rounded-xl text-[10px] font-semibold text-white">
          AC
        </div>
        <div>
          <p className="text-xs text-slate-400">Admin workspace</p>
          <p className="text-sm font-semibold text-white">Atlas Console</p>
        </div>
      </div>

      <div className="hidden items-center gap-3 lg:flex">
        <div className="bg-card-steel ui-surface flex items-center gap-2 rounded-full px-3 py-2 text-xs text-slate-300">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          Live system healthy
        </div>
        <div className="bg-card-steel ui-surface flex items-center gap-2 rounded-full px-3 py-2 text-xs text-slate-300">
          Alerts: <span className="text-white">{3}</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="bg-card-steel ui-surface hidden items-center gap-2 rounded-full px-3 py-2 text-xs text-slate-300 lg:flex">
          <span className="text-slate-400">Search</span>
          <input
            placeholder="Users, deposits, tx"
            className="w-40 bg-transparent text-xs text-white placeholder:text-slate-500 focus:outline-none"
          />
        </div>
        <NotificationsButton viewAllHref="/admin/inbox" />
        <ThemeToggle />
        <ProfileMenu
          profileHref="/admin/profile"
          email={props.userEmail}
          name={props.userName ?? null}
          avatarUrl={props.avatarUrl ?? null}
        />
        <button
          className="bg-card-indigo ui-surface rounded-md px-3 py-1 text-xs text-slate-300 hover:text-white lg:hidden"
          type="button"
          onClick={() => setOpen(!open)}
        >
          Menu
        </button>
      </div>

      {open && (
        <div className="bg-card-navy ui-surface absolute left-4 right-4 top-16 z-50 max-h-[70vh] overflow-y-auto rounded-2xl p-4 shadow-lg">
          <div className="grid gap-2 text-sm text-slate-300">
            {adminNavItems.map(item => (
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
