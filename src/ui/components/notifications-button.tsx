'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Bell, CheckCheck } from 'lucide-react';
import { safeJsonClient } from '@/lib/http/safe-json-client';

type NotificationRow = {
  id: string;
  type: 'INFO' | 'WARNING' | 'SUCCESS' | 'ERROR';
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  href?: string;
  attachment_url?: string | null;
  system?: boolean;
};

function badgeText(n: number) {
  if (n <= 0) return '';
  if (n > 99) return '99+';
  return String(n);
}

function typeAccent(type: NotificationRow['type']) {
  if (type === 'SUCCESS') return 'bg-emerald-400/15 text-emerald-200 border-emerald-400/25';
  if (type === 'WARNING') return 'bg-amber-400/15 text-amber-200 border-amber-400/25';
  if (type === 'ERROR') return 'bg-rose-400/15 text-rose-200 border-rose-400/25';
  return 'bg-cyan-400/15 text-cyan-200 border-cyan-400/25';
}

export function NotificationsButton(props: { viewAllHref: string }) {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<NotificationRow[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement | null>(null);
  const firstLoadDone = useRef(false);
  const knownIds = useRef<Set<string>>(new Set());
  const audioCtxRef = useRef<AudioContext | null>(null);
  const audioUnlockedRef = useRef(false);

  function shouldPlayNotificationSound(item: NotificationRow) {
    return item.read === false;
  }

  async function unlockAudio() {
    try {
      if (audioUnlockedRef.current) return true;
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return false;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx();
      }
      if (audioCtxRef.current.state === 'suspended') {
        await audioCtxRef.current.resume();
      }
      audioUnlockedRef.current = audioCtxRef.current.state === 'running';
      return audioUnlockedRef.current;
    } catch {
      return false;
    }
  }

  function playNotificationSound() {
    try {
      const ctx = audioCtxRef.current;
      if (!ctx || ctx.state !== 'running') return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = 1040;
      gain.gain.value = 0.001;
      osc.connect(gain);
      gain.connect(ctx.destination);
      const now = ctx.currentTime;
      gain.gain.exponentialRampToValueAtTime(0.28, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.06, now + 0.14);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.42);
      osc.start(now);
      osc.stop(now + 0.45);
    } catch {
      // ignore audio errors silently
    }
  }

  const hasUnread = unreadCount > 0;
  const badge = useMemo(() => badgeText(unreadCount), [unreadCount]);

  async function xhrFetch(input: string, init?: RequestInit): Promise<Response | null> {
    return await new Promise(resolve => {
      try {
        const xhr = new XMLHttpRequest();
        xhr.open((init?.method ?? 'GET').toUpperCase(), input, true);
        xhr.withCredentials = init?.credentials === 'include';

        if (init?.headers) {
          const headers = new Headers(init.headers);
          headers.forEach((value, key) => xhr.setRequestHeader(key, value));
        }

        xhr.onreadystatechange = () => {
          if (xhr.readyState !== 4) return;
          const headers = new Headers();
          const rawHeaders = xhr.getAllResponseHeaders();
          rawHeaders
            .trim()
            .split(/[\r\n]+/)
            .forEach(line => {
              const index = line.indexOf(':');
              if (index > 0) {
                const key = line.slice(0, index).trim();
                const value = line.slice(index + 1).trim();
                if (key) headers.append(key, value);
              }
            });
          resolve(new Response(xhr.responseText ?? '', { status: xhr.status || 0, headers }));
        };

        xhr.onerror = () => resolve(null);
        xhr.onabort = () => resolve(null);

        if (init?.body && typeof init.body === 'string') {
          xhr.send(init.body);
        } else {
          xhr.send();
        }
      } catch {
        resolve(null);
      }
    });
  }

  async function safeFetch(input: string, init?: RequestInit) {
    try {
      return await fetch(input, init);
    } catch {
      return await xhrFetch(input, init);
    }
  }

  async function load() {
    const res = await safeFetch('/api/notifications?limit=12', { cache: 'no-store', credentials: 'include' });
    if (!res) {
      setMessage('Unable to load notifications. Check connection or browser extension settings.');
      return;
    }
    const data = await safeJsonClient<any>(res);
    if (!res.ok) {
      setMessage(data?.message ?? data?.error ?? 'Failed to load notifications.');
      return;
    }
    const fetchedRows = (data?.data ?? []) as NotificationRow[];
    if (firstLoadDone.current) {
      const hasNewUnread = fetchedRows.some(item => !knownIds.current.has(item.id) && shouldPlayNotificationSound(item));
      if (hasNewUnread) playNotificationSound();
    } else {
      firstLoadDone.current = true;
    }
    knownIds.current = new Set(fetchedRows.map(item => item.id));
    setRows(fetchedRows);
    setUnreadCount(Number(data?.unreadCount ?? 0));
  }

  useEffect(() => {
    load().catch(() => null);
    const t = setInterval(() => load().catch(() => null), 15000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const onInteract = () => {
      unlockAudio().catch(() => null);
    };
    window.addEventListener('pointerdown', onInteract, { once: true });
    window.addEventListener('keydown', onInteract, { once: true });
    return () => {
      window.removeEventListener('pointerdown', onInteract);
      window.removeEventListener('keydown', onInteract);
    };
  }, []);

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

  async function markRead(id: string) {
    if (id.startsWith('system:')) return;
    const res = await safeFetch(`/api/notifications/${id}/read`, { method: 'POST', credentials: 'include' });
    if (!res) {
      setMessage('Network request failed while marking notification.');
      return;
    }
    const data = await safeJsonClient<any>(res);
    if (!res.ok) {
      setMessage(data?.message ?? data?.error ?? 'Failed.');
      return;
    }
    setRows(prev => prev.map(r => (r.id === id ? { ...r, read: true } : r)));
    setUnreadCount(prev => Math.max(0, prev - 1));
  }

  async function markAllRead() {
    const res = await safeFetch('/api/notifications/read-all', { method: 'POST', credentials: 'include' });
    if (!res) {
      setMessage('Network request failed while marking all notifications.');
      return;
    }
    const data = await safeJsonClient<any>(res);
    if (!res.ok) {
      setMessage(data?.message ?? data?.error ?? 'Failed.');
      return;
    }
    setRows(prev => prev.map(r => ({ ...r, read: true })));
    setUnreadCount(0);
    setMessage(data?.message ?? 'Marked all as read.');
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => {
          unlockAudio().catch(() => null);
          setOpen(v => !v);
          setMessage(null);
          load().catch(() => null);
        }}
        className={`ui-surface relative inline-flex items-center justify-center rounded-full px-3 py-2 text-slate-200 hover:text-white ${
          open ? 'bg-card-accent' : 'bg-card-indigo'
        }`}
        title="Notifications"
      >
        <Bell className="h-4 w-4" />
        {hasUnread ? (
          <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white shadow-[0_0_18px_rgba(244,63,94,0.55)]">
            {badge}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="bg-card-navy ui-surface absolute right-0 top-11 z-[1000] w-[22rem] rounded-2xl p-3 text-sm text-slate-200">
          <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-3">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-cyan-200">Inbox</p>
              <p className="mt-1 text-sm font-semibold text-white">Notifications</p>
            </div>
            <button
              type="button"
              onClick={() => markAllRead().catch(() => null)}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/30 px-3 py-1 text-xs text-slate-200 hover:bg-white/10"
            >
              <CheckCheck className="h-4 w-4" />
              Mark all read
            </button>
          </div>

          <div className="mt-3 max-h-[22rem] space-y-2 overflow-y-auto pr-1">
            {rows.map(n => (
              <button
                key={n.id}
                type="button"
                onClick={() => {
                  setMessage(null);
                  if (n.href) {
                    window.location.href = n.href;
                    return;
                  }
                  markRead(n.id).catch(() => null);
                }}
                className={`w-full rounded-2xl border px-3 py-3 text-left transition ${
                  n.read ? 'border-white/10 bg-black/20 hover:bg-white/5' : 'border-white/15 bg-white/5 hover:bg-white/10'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] ${typeAccent(n.type)}`}>
                        {n.type}
                      </span>
                      {!n.read ? <span className="h-1.5 w-1.5 rounded-full bg-rose-400" /> : null}
                    </div>
                    <p className="mt-1 truncate text-sm font-semibold text-white">{n.title}</p>
                    <p className="mt-1 line-clamp-2 text-xs text-slate-300">{n.message}</p>
                    {n.attachment_url ? (
                      <a
                        href={n.attachment_url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 inline-block text-[11px] text-cyan-200 underline"
                        onClick={e => e.stopPropagation()}
                      >
                        View attachment
                      </a>
                    ) : null}
                  </div>
                  <p className="shrink-0 text-[10px] text-slate-400">{new Date(n.created_at).toLocaleDateString()}</p>
                </div>
              </button>
            ))}
            {rows.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-6 text-center text-sm text-slate-300">
                No notifications yet.
              </div>
            ) : null}
          </div>

          {message ? (
            <div className="mt-3 rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-slate-200">
              {message}
            </div>
          ) : null}

          <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3 text-xs">
            <span className="text-slate-400">Unread: <span className="text-white">{unreadCount}</span></span>
            <Link href={props.viewAllHref} className="rounded-full border border-white/10 px-3 py-1 hover:bg-white/10" onClick={() => setOpen(false)}>
              View all
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
