'use client';

import { useEffect, useState } from 'react';
import { safeJsonClient } from '@/lib/http/safe-json-client';

type Row = {
  id: string;
  title: string;
  message: string;
  type: 'GENERAL' | 'PROFIT_DELAY' | 'MAINTENANCE';
  is_active: boolean;
  published_at: string;
  expires_at?: string | null;
  CreatedBy?: { email?: string | null };
};

export default function AdminAnnouncementsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [type, setType] = useState<Row['type']>('GENERAL');
  const [expiresAt, setExpiresAt] = useState('');

  async function load() {
    const res = await fetch('/api/admin/announcements', { cache: 'no-store' });
    const data = await safeJsonClient<any>(res);
    if (!res.ok) {
      setMessage(data?.message ?? 'Failed to load announcements');
      return;
    }
    setRows(data?.data ?? []);
  }

  useEffect(() => {
    load().catch(() => null);
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    const res = await fetch('/api/admin/announcements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        message: body,
        type,
        isActive: true,
        expiresAt: expiresAt ? new Date(`${expiresAt}T23:59:59.999Z`).toISOString() : ''
      })
    });
    const data = await safeJsonClient<any>(res);
    setMessage(data?.message ?? (res.ok ? 'Posted' : 'Failed'));
    if (res.ok) {
      setTitle('');
      setBody('');
      setExpiresAt('');
      await load();
    }
  }

  async function toggle(id: string, isActive: boolean) {
    const res = await fetch('/api/admin/announcements', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, isActive })
    });
    const data = await safeJsonClient<any>(res);
    setMessage(data?.message ?? (res.ok ? 'Updated' : 'Failed'));
    await load();
  }

  return (
    <div className="space-y-6 text-white">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-200">Announcement Board</p>
        <h1 className="mt-2 text-2xl font-semibold">Post announcements</h1>
        <p className="mt-2 text-sm text-slate-300">Profit delay and maintenance notices for all users.</p>
      </div>

      <form onSubmit={create} className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="grid gap-3 md:grid-cols-2">
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title" className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm" />
          <select value={type} onChange={e => setType(e.target.value as Row['type'])} className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm">
            <option value="GENERAL">General</option>
            <option value="PROFIT_DELAY">Profit delay</option>
            <option value="MAINTENANCE">Maintenance notice</option>
          </select>
          <textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Message" className="min-h-28 rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm md:col-span-2" />
          <input type="date" value={expiresAt} onChange={e => setExpiresAt(e.target.value)} className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm" />
        </div>
        <button className="mt-4 rounded-full border border-white/10 bg-cyan-500/20 px-4 py-2 text-sm">Post announcement</button>
        {message ? <p className="mt-2 text-xs text-slate-300">{message}</p> : null}
      </form>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-lg font-semibold">Active & history</h2>
        <div className="mt-3 space-y-2 text-sm text-slate-300">
          {rows.map(r => (
            <div key={r.id} className="rounded-xl border border-white/10 bg-black/20 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold text-white">{r.title}</p>
                <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px]">{r.type}</span>
              </div>
              <p className="mt-1 text-xs text-slate-300">{r.message}</p>
              <p className="mt-1 text-[11px] text-slate-500">{new Date(r.published_at).toLocaleString()} · {r.CreatedBy?.email ?? '-'}</p>
              <button onClick={() => toggle(r.id, !r.is_active)} className="mt-2 rounded-full border border-white/10 px-3 py-1 text-xs">
                {r.is_active ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          ))}
          {rows.length === 0 ? <p>No announcements yet.</p> : null}
        </div>
      </div>
    </div>
  );
}
