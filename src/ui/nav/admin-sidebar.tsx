'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

const iconBase = 'h-4 w-4 text-slate-300';

const Icons: Record<string, ReactNode> = {
  dashboard: (
    <svg viewBox="0 0 24 24" className={iconBase} aria-hidden="true">
      <path fill="currentColor" d="M4 13h6V4H4v9zm0 7h6v-5H4v5zm10 0h6v-9h-6v9zm0-16v5h6V4h-6z" />
    </svg>
  ),
  users: (
    <svg viewBox="0 0 24 24" className={iconBase} aria-hidden="true">
      <path fill="currentColor" d="M16 11a4 4 0 1 0-3.999-4A4 4 0 0 0 16 11zM6 11a3 3 0 1 0-3-3 3 3 0 0 0 3 3zm0 2c-2.76 0-6 1.39-6 4v3h8v-3c0-1.07.4-2.05 1.06-2.84C8.18 13.42 7.04 13 6 13zm10 0c-2.67 0-8 1.34-8 4v3h16v-3c0-2.66-5.33-4-8-4z" />
    </svg>
  ),
  wallet: (
    <svg viewBox="0 0 24 24" className={iconBase} aria-hidden="true">
      <path fill="currentColor" d="M3 7a3 3 0 0 1 3-3h12a2 2 0 0 1 2 2v2h-2V6H6a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h12v-2h2v2a2 2 0 0 1-2 2H6a3 3 0 0 1-3-3V7zm13 4h5v6h-5a3 3 0 0 1 0-6zm1 2a1 1 0 0 0 0 2h3v-2h-3z" />
    </svg>
  ),
  plans: (
    <svg viewBox="0 0 24 24" className={iconBase} aria-hidden="true">
      <path fill="currentColor" d="M4 4h16v4H4V4zm0 6h10v4H4v-4zm0 6h16v4H4v-4zm12-6h4v4h-4v-4z" />
    </svg>
  ),
  investments: (
    <svg viewBox="0 0 24 24" className={iconBase} aria-hidden="true">
      <path fill="currentColor" d="M3 3h2v18H3V3zm4 10h2v8H7v-8zm4-6h2v14h-2V7zm4 4h2v10h-2V11zm4-8h2v18h-2V3z" />
    </svg>
  ),
  transactions: (
    <svg viewBox="0 0 24 24" className={iconBase} aria-hidden="true">
      <path fill="currentColor" d="M7 7h11V4l4 4-4 4V9H7V7zm10 10H6v3l-4-4 4-4v3h11v2z" />
    </svg>
  ),
  deposits: (
    <svg viewBox="0 0 24 24" className={iconBase} aria-hidden="true">
      <path fill="currentColor" d="M5 20h14v-2H5v2zM12 4l6 6h-4v6h-4v-6H6l6-6z" />
    </svg>
  ),
  withdrawals: (
    <svg viewBox="0 0 24 24" className={iconBase} aria-hidden="true">
      <path fill="currentColor" d="M5 4h14v2H5V4zm7 6v6h4l-6 6-6-6h4v-6h4z" />
    </svg>
  ),
  referral: (
    <svg viewBox="0 0 24 24" className={iconBase} aria-hidden="true">
      <path fill="currentColor" d="M16 11a3 3 0 1 0-3-3 3 3 0 0 0 3 3zM8 13a3 3 0 1 0-3-3 3 3 0 0 0 3 3zm8 2c-2.33 0-7 1.17-7 3.5V20h14v-1.5C23 16.17 18.33 15 16 15zM8 15c-1.2 0-2.88.29-4.14.89C2.46 16.5 2 17.3 2 18.5V20h6v-1.5c0-1.57.67-2.6 1.58-3.32A11.1 11.1 0 0 0 8 15z" />
    </svg>
  ),
  kyc: (
    <svg viewBox="0 0 24 24" className={iconBase} aria-hidden="true">
      <path fill="currentColor" d="M12 2 4 5v6c0 5 3.8 9.7 8 11 4.2-1.3 8-6 8-11V5l-8-3zm-1 14-4-4 1.4-1.4L11 13.2l4.6-4.6L17 10l-6 6z" />
    </svg>
  ),
  bonus: (
    <svg viewBox="0 0 24 24" className={iconBase} aria-hidden="true">
      <path fill="currentColor" d="M20 7h-4.2a3 3 0 1 0-5.6 0H6v4h14V7zM6 13h6v8H6v-8zm8 0h6v8h-6v-8z" />
    </svg>
  ),
  notification: (
    <svg viewBox="0 0 24 24" className={iconBase} aria-hidden="true">
      <path fill="currentColor" d="M12 22a2 2 0 0 0 2-2h-4a2 2 0 0 0 2 2zm6-6V11a6 6 0 0 0-5-5.91V4a1 1 0 0 0-2 0v1.09A6 6 0 0 0 6 11v5l-2 2v1h16v-1l-2-2z" />
    </svg>
  ),
  cms: (
    <svg viewBox="0 0 24 24" className={iconBase} aria-hidden="true">
      <path fill="currentColor" d="M4 4h16v4H4V4zm0 6h10v10H4V10zm12 0h4v10h-4V10z" />
    </svg>
  ),
  documents: (
    <svg viewBox="0 0 24 24" className={iconBase} aria-hidden="true">
      <path fill="currentColor" d="M6 2h9l5 5v15H6V2zm9 1.5V8h4.5L15 3.5zM9 12h8v2H9v-2zm0 4h8v2H9v-2z" />
    </svg>
  ),
  roles: (
    <svg viewBox="0 0 24 24" className={iconBase} aria-hidden="true">
      <path fill="currentColor" d="M12 2 4 5v6c0 5 3.8 9.7 8 11 4.2-1.3 8-6 8-11V5l-8-3zm0 5a3 3 0 1 1-3 3 3 3 0 0 1 3-3zm4 10H8v-1c0-1.66 3.34-2.5 4-2.5s4 .84 4 2.5v1z" />
    </svg>
  ),
  staff: (
    <svg viewBox="0 0 24 24" className={iconBase} aria-hidden="true">
      <path fill="currentColor" d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4zm0 2c-3 0-8 1.5-8 4v2h16v-2c0-2.5-5-4-8-4z" />
    </svg>
  ),
  schema: (
    <svg viewBox="0 0 24 24" className={iconBase} aria-hidden="true">
      <path fill="currentColor" d="M4 5h6v6H4V5zm10 0h6v6h-6V5zM4 13h6v6H4v-6zm10 0h6v6h-6v-6z" />
    </svg>
  ),
  schedule: (
    <svg viewBox="0 0 24 24" className={iconBase} aria-hidden="true">
      <path fill="currentColor" d="M7 2h2v2h6V2h2v2h3v18H4V4h3V2zm12 6H5v12h14V8zm-7 2h2v5h-2v-5zm-4 0h2v3H8v-3z" />
    </svg>
  ),
  landing: (
    <svg viewBox="0 0 24 24" className={iconBase} aria-hidden="true">
      <path fill="currentColor" d="M4 5h16v3H4V5zm0 5h10v9H4v-9zm12 0h4v9h-4v-9z" />
    </svg>
  ),
  pages: (
    <svg viewBox="0 0 24 24" className={iconBase} aria-hidden="true">
      <path fill="currentColor" d="M6 2h9l5 5v15H6V2zm9 1.5V8h4.5L15 3.5z" />
    </svg>
  ),
  settings: (
    <svg viewBox="0 0 24 24" className={iconBase} aria-hidden="true">
      <path fill="currentColor" d="M19.14 12.94a7.43 7.43 0 0 0 .05-.94 7.43 7.43 0 0 0-.05-.94l2.03-1.58-1.92-3.32-2.39.96a7.63 7.63 0 0 0-1.62-.94l-.36-2.54h-3.84l-.36 2.54a7.63 7.63 0 0 0-1.62.94l-2.39-.96-1.92 3.32 2.03 1.58a7.43 7.43 0 0 0-.05.94 7.43 7.43 0 0 0 .05.94l-2.03 1.58 1.92 3.32 2.39-.96a7.63 7.63 0 0 0 1.62.94l.36 2.54h3.84l.36-2.54a7.63 7.63 0 0 0 1.62-.94l2.39.96 1.92-3.32-2.03-1.58zM12 15.5A3.5 3.5 0 1 1 15.5 12 3.5 3.5 0 0 1 12 15.5z" />
    </svg>
  ),
  report: (
    <svg viewBox="0 0 24 24" className={iconBase} aria-hidden="true">
      <path fill="currentColor" d="M3 3h18v2H3V3zm2 4h14v14H5V7zm3 3v8h2v-8H8zm4 3v5h2v-5h-2zm4-2v7h2v-7h-2z" />
    </svg>
  )
};

const sections = [
  {
    title: 'Core',
    items: [
      { href: '/admin/dashboard', label: 'Dashboard', icon: Icons.dashboard },
      { href: '/admin/profile', label: 'Profile', icon: Icons.users },
      { href: '/admin/security', label: 'Security (2FA)', icon: Icons.settings },
      { href: '/admin/users', label: 'User Management', icon: Icons.users },
      { href: '/admin/wallets', label: 'Wallet Management', icon: Icons.wallet },
      { href: '/admin/transactions', label: 'Transactions', icon: Icons.transactions },
      { href: '/admin/documents', label: 'Document Center', icon: Icons.documents }
    ]
  },
  {
    title: 'Investments',
    items: [
      { href: '/admin/plans', label: 'Investment Plans', icon: Icons.plans },
      { href: '/admin/investments', label: 'Investments', icon: Icons.investments },
      { href: '/admin/profits/approvals', label: 'Profit Batches', icon: Icons.bonus },
      { href: '/admin/user-profits', label: 'User Profits', icon: Icons.investments },
      { href: '/admin/referrals', label: 'Manage Referral', icon: Icons.referral }
    ]
  },
  {
    title: 'Payments',
    items: [
      { href: '/admin/deposits', label: 'Deposits', icon: Icons.deposits },
      { href: '/admin/withdrawals', label: 'Withdrawals', icon: Icons.withdrawals },
      { href: '/admin/manual-approvals/deposits', label: 'Manual Deposit Review', icon: Icons.deposits },
      { href: '/admin/manual-approvals/withdrawals', label: 'Manual Withdrawal Review', icon: Icons.withdrawals },
      { href: '/admin/gateways', label: 'Automatic Gateways', icon: Icons.wallet }
    ]
  },
  {
    title: 'Compliance',
    items: [
      { href: '/admin/kyc', label: 'KYC Management', icon: Icons.kyc },
      { href: '/admin/bonus', label: 'Bonus / Rewards', icon: Icons.bonus },
      { href: '/admin/notifications', label: 'Notifications', icon: Icons.notification },
      { href: '/admin/announcements', label: 'Announcement Board', icon: Icons.notification }
    ]
  },
  {
    title: 'Ops & CMS',
    items: [
      { href: '/admin/cms', label: 'CMS', icon: Icons.cms },
      { href: '/admin/landing', label: 'Landing Page', icon: Icons.landing },
      { href: '/admin/pages', label: 'Pages', icon: Icons.pages },
      { href: '/admin/page-settings', label: 'Page Settings', icon: Icons.pages },
      { href: '/admin/navigation', label: 'Site Navigation', icon: Icons.pages },
      { href: '/admin/footer', label: 'Footer Contents', icon: Icons.pages }
    ]
  },
  {
    title: 'Access',
    items: [
      { href: '/admin/roles', label: 'Manage Roles', icon: Icons.roles },
      { href: '/admin/staff', label: 'Manage Staffs', icon: Icons.staff },
      { href: '/admin/admin-activity', label: 'Admin Activity', icon: Icons.report }
    ]
  },
  {
    title: 'System',
    items: [
      { href: '/admin/schema', label: 'Manage Schema', icon: Icons.schema },
      { href: '/admin/schedule', label: 'Schedule', icon: Icons.schedule },
      { href: '/admin/email-templates', label: 'Email Templates', icon: Icons.notification },
      { href: '/admin/themes', label: 'Theme Management', icon: Icons.pages },
      { href: '/admin/subscribers', label: 'All Subscribers', icon: Icons.users },
      { href: '/admin/support', label: 'Support Tickets', icon: Icons.notification },
      { href: '/admin/custom-css', label: 'Custom CSS', icon: Icons.schema },
      { href: '/admin/cache', label: 'Clear Cache', icon: Icons.report },
      { href: '/admin/app-details', label: 'Application Details', icon: Icons.report },
      { href: '/admin/reports', label: 'Reports & Analytics', icon: Icons.report },
      { href: '/admin/settings', label: 'Settings', icon: Icons.settings }
    ]
  }
];

export const adminNavItems = sections.flatMap(section => section.items);

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="bg-card-navy ui-surface hidden h-screen w-72 lg:block">
      <div className="flex h-16 items-center gap-3 px-6">
        <div className="bg-card-accent ui-surface flex h-10 w-10 items-center justify-center rounded-2xl text-white">
          A
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-cyan-200">Atlas</p>
          <p className="text-sm font-semibold text-white">Admin Console</p>
        </div>
      </div>
      <div className="h-[calc(100vh-4rem)] overflow-y-auto px-4 pb-6">
        {sections.map(section => (
          <div key={section.title} className="mb-6">
            <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.25em] text-slate-500">
              {section.title}
            </p>
            <div className="mt-2 grid gap-1">
              {section.items.map(item => {
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`group relative flex items-center gap-3 rounded-2xl px-3 py-2 text-sm ui-surface-nav ${
                      active
                        ? 'bg-card-accent text-white'
                        : 'bg-card-steel text-slate-200 hover:bg-card-indigo hover:text-white'
                    }`}
                  >
                    <span
                      className={`flex h-9 w-9 items-center justify-center rounded-2xl border border-white/10 bg-black/25 ${
                        active ? 'shadow-[0_0_0_1px_rgba(255,255,255,0.06)_inset]' : 'group-hover:bg-black/30'
                      }`}
                    >
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                    <span
                      className={`ml-auto h-1.5 w-1.5 rounded-full ${
                        active ? 'bg-cyan-300 shadow-[0_0_16px_rgba(34,211,238,0.55)]' : 'bg-white/10 group-hover:bg-cyan-300/60'
                      }`}
                    />
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
