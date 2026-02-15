'use client';

import Link from 'next/link';

function initialsFrom(nameOrEmail: string) {
  const base = (nameOrEmail || 'U').trim();
  const parts = base.includes('@') ? [base.split('@')[0] ?? 'U'] : base.split(/\s+/).filter(Boolean);
  const letters = parts.map(p => p[0] ?? '').join('').slice(0, 2).toUpperCase();
  return letters || 'U';
}

export function AvatarChip(props: {
  href: string;
  email?: string;
  name?: string | null;
  avatarUrl?: string | null;
}) {
  const label = (props.name && props.name.trim()) ? props.name.trim() : (props.email ?? 'Account');
  const initials = initialsFrom(props.name?.trim() || props.email || 'U');

  return (
    <Link
      href={props.href}
      className="bg-card-steel ui-surface inline-flex items-center gap-2 rounded-full px-2 py-1 text-xs text-slate-200 hover:text-white"
      title={label}
    >
      <span className="bg-card-navy ui-surface flex h-8 w-8 items-center justify-center overflow-hidden rounded-full text-[11px] font-semibold text-white">
        {props.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={props.avatarUrl} alt="avatar" className="h-full w-full object-cover" />
        ) : (
          initials
        )}
      </span>
      <span className="hidden max-w-[12rem] truncate sm:inline">{label}</span>
    </Link>
  );
}
