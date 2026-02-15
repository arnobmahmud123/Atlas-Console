'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { safeJsonClient } from '@/lib/http/safe-json-client';

function initialsFrom(nameOrEmail: string) {
  const base = (nameOrEmail || 'U').trim();
  const parts = base.includes('@') ? [base.split('@')[0] ?? 'U'] : base.split(/\s+/).filter(Boolean);
  const letters = parts.map(p => p[0] ?? '').join('').slice(0, 2).toUpperCase();
  return letters || 'U';
}

export function ProfileMenu(props: {
  profileHref: string;
  email?: string;
  name?: string | null;
  avatarUrl?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  const [live, setLive] = useState<{ email?: string; name?: string | null; avatarUrl?: string | null } | null>(null);

  const liveEmail = live?.email ?? props.email;
  const liveName = live?.name ?? props.name ?? null;
  const liveAvatar = live?.avatarUrl ?? props.avatarUrl ?? null;

  const label = (liveName && liveName.trim()) ? liveName.trim() : (liveEmail ?? 'Account');
  const initials = useMemo(() => initialsFrom(liveName?.trim() || liveEmail || 'U'), [liveName, liveEmail]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!ref.current) return;
      const target = e.target as Node | null;
      if (target && ref.current.contains(target)) return;
      setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  async function loadLive() {
    const res = await fetch('/api/me', { cache: 'no-store' }).catch(() => null);
    if (!res) return;
    const data = await safeJsonClient<any>(res);
    if (data?.ok && data?.user) {
      setLive({
        email: data.user.email,
        name: data.user.UserProfile?.full_name ?? null,
        avatarUrl: data.user.UserProfile?.avatar_url ?? null
      });
    }
  }

  useEffect(() => {
    // Load once on mount so the top-right label reflects updated name/email without opening the menu.
    loadLive().catch(() => null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      const res = await fetch('/api/me', { cache: 'no-store' }).catch(() => null);
      if (!res) return;
      const data = await safeJsonClient<any>(res);
      if (cancelled) return;
      if (data?.ok && data?.user) {
        setLive({
          email: data.user.email,
          name: data.user.UserProfile?.full_name ?? null,
          avatarUrl: data.user.UserProfile?.avatar_url ?? null
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="bg-card-steel ui-surface inline-flex items-center gap-2 rounded-full px-2 py-1 text-xs text-slate-200 hover:text-white"
        title={label}
      >
        <span className="bg-card-navy ui-surface flex h-8 w-8 items-center justify-center overflow-hidden rounded-full text-[11px] font-semibold text-white">
          {liveAvatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={liveAvatar} alt="avatar" className="h-full w-full object-cover" />
          ) : (
            initials
          )}
        </span>
        <span className="hidden max-w-[12rem] truncate sm:inline">{label}</span>
        <span className="hidden text-slate-400 sm:inline">▾</span>
      </button>

      {open ? (
        <div className="bg-card-navy ui-surface absolute right-0 top-11 z-[1000] w-72 rounded-2xl p-3 text-sm text-slate-200">
          <div className="flex items-center gap-3 border-b border-white/10 pb-3">
            <div className="bg-card-indigo ui-surface flex h-10 w-10 items-center justify-center overflow-hidden rounded-2xl text-sm font-semibold">
              {liveAvatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={liveAvatar} alt="avatar" className="h-full w-full object-cover" />
              ) : (
                initials
              )}
            </div>
            <div className="min-w-0">
              <div className="truncate text-white">{label}</div>
              <div className="truncate text-xs text-slate-400">{liveEmail ?? ''}</div>
            </div>
          </div>

          <div className="mt-3 grid gap-1">
            <Link
              href={props.profileHref}
              className="rounded-xl px-3 py-2 hover:bg-white/10"
              onClick={() => setOpen(false)}
            >
              Edit profile
            </Link>
            <Link
              href={`${props.profileHref}#email`}
              className="rounded-xl px-3 py-2 hover:bg-white/10"
              onClick={() => setOpen(false)}
            >
              Change email
            </Link>
            <Link
              href={`${props.profileHref}#password`}
              className="rounded-xl px-3 py-2 hover:bg-white/10"
              onClick={() => setOpen(false)}
            >
              Change password
            </Link>
            <button
              type="button"
              className="rounded-xl px-3 py-2 text-left text-rose-200 hover:bg-white/10"
              onClick={() => signOut({ callbackUrl: '/' })}
            >
              Logout
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
