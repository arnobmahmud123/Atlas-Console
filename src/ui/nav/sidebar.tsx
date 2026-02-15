'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export const navItems = [
  { href: '/dashboard', label: 'Overview' },
  { href: '/dashboard/wallets', label: 'Wallets' },
  { href: '/dashboard/investments', label: 'Investments' },
  { href: '/dashboard/referrals', label: 'Referrals' },
  { href: '/dashboard/payments', label: 'Payments' },
  { href: '/dashboard/support', label: 'Support Tickets' },
  { href: '/dashboard/announcements', label: 'Announcements' },
  { href: '/dashboard/documents', label: 'Document Center' },
  { href: '/dashboard/cctv', label: 'Live CCTV' },
  { href: '/dashboard/kyc', label: 'KYC' },
  { href: '/dashboard/security', label: 'Security' },
  { href: '/dashboard/profile', label: 'Profile' }
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="bg-card-navy ui-surface hidden h-screen w-64 lg:block">
      <div className="flex h-16 items-center px-6 text-sm font-semibold text-white">
        Atlas Console
      </div>
      <nav className="flex flex-col gap-1 px-3">
        {navItems.map(item => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-2xl px-3 py-2 text-sm ui-surface-nav ${
                active ? 'bg-card-accent text-white' : 'bg-card-steel text-slate-200 hover:bg-card-indigo hover:text-white'
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
