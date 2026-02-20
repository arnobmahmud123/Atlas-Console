'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export const accountantNavItems = [
  { href: '/accountant/dashboard', label: 'Overview' },
  { href: '/accountant/security', label: 'Security (2FA)' },
  { href: '/accountant/profits', label: 'Profit Batches' },
  { href: '/accountant/deposits', label: 'Pending Deposits' },
  { href: '/accountant/withdrawals', label: 'Pending Withdrawals' },
  { href: '/accountant/support', label: 'Support Tickets' }
];

export function AccountantSidebar() {
  const pathname = usePathname();
  return (
    <aside className="bg-card-navy ui-surface hidden h-screen w-64 lg:block">
      <div className="flex h-16 items-center px-6 text-sm font-semibold text-white">Accountant Console</div>
      <nav className="flex flex-col gap-1 px-3">
        {accountantNavItems.map(item => {
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
