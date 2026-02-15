'use client';

import { useEffect, useMemo, useState } from 'react';
import { safeJsonClient } from '@/lib/http/safe-json-client';

type AnnouncementRow = {
  id: string;
  title: string;
  message: string;
  type: 'GENERAL' | 'PROFIT_DELAY' | 'MAINTENANCE';
  published_at: string;
};

function disableKey(id: string) {
  return `announcement-popup-disabled:${id}`;
}

function typeBadgeClass(type: AnnouncementRow['type']) {
  if (type === 'MAINTENANCE') return 'border-amber-400/30 bg-amber-400/10 text-amber-200';
  if (type === 'PROFIT_DELAY') return 'border-rose-400/30 bg-rose-400/10 text-rose-200';
  return 'border-cyan-400/30 bg-cyan-400/10 text-cyan-200';
}

export function AnnouncementPopup(props: { initialAnnouncements?: AnnouncementRow[] }) {
  const [announcement, setAnnouncement] = useState<AnnouncementRow | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function load() {
      const seeded = props.initialAnnouncements ?? [];
      if (seeded.length) {
        const firstSeeded = seeded.find(row => !localStorage.getItem(disableKey(row.id)));
        if (firstSeeded) {
          setAnnouncement(firstSeeded);
          setOpen(true);
          return;
        }
      }

      try {
        const res = await fetch('/api/announcements', { cache: 'no-store', credentials: 'include' });
        const payload = await safeJsonClient<{ ok: boolean; data: AnnouncementRow[] }>(res);
        if (!mounted || !res.ok) return;
        const rows = payload?.data ?? [];
        const firstActive = rows.find(row => !localStorage.getItem(disableKey(row.id)));
        if (!firstActive) return;
        setAnnouncement(firstActive);
        setOpen(true);
      } catch {
        // ignore popup failure
      }
    }

    load().catch(() => null);
    return () => {
      mounted = false;
    };
  }, [props.initialAnnouncements]);

  const badgeClass = useMemo(
    () => (announcement ? typeBadgeClass(announcement.type) : ''),
    [announcement]
  );

  if (!announcement || !open) return null;

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-card-navy p-6 text-white shadow-[0_20px_80px_rgba(0,0,0,0.6)]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-200">Announcement Board</p>
            <h2 className="mt-2 text-xl font-semibold">{announcement.title}</h2>
          </div>
          <span className={`rounded-full border px-2 py-0.5 text-[10px] ${badgeClass}`}>{announcement.type}</span>
        </div>
        <p className="mt-4 text-sm text-slate-200">{announcement.message}</p>
        <p className="mt-2 text-xs text-slate-400">{new Date(announcement.published_at).toLocaleString()}</p>
        <div className="mt-6 flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-full border border-white/10 px-4 py-2 text-xs hover:bg-white/10"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => {
              localStorage.setItem(disableKey(announcement.id), '1');
              setOpen(false);
            }}
            className="rounded-full border border-cyan-300/30 bg-cyan-400/10 px-4 py-2 text-xs text-cyan-100 hover:bg-cyan-400/20"
          >
            Don&apos;t show again
          </button>
        </div>
      </div>
    </div>
  );
}
