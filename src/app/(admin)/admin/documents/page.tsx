'use client';

import { useEffect, useState } from 'react';
import { safeJsonClient } from '@/lib/http/safe-json-client';

type Row = {
  id: string;
  title: string;
  category: 'BUSINESS_LICENSE' | 'SHOP_LEASE' | 'TAX_FILE' | 'OTHER';
  file_url: string;
  notes?: string | null;
  is_active: boolean;
  created_at: string;
  UploadedBy?: { email?: string | null };
};

const categories = [
  { value: 'BUSINESS_LICENSE', label: 'Business license' },
  { value: 'SHOP_LEASE', label: 'Shop lease document' },
  { value: 'TAX_FILE', label: 'Tax files' },
  { value: 'OTHER', label: 'Other' }
] as const;

export default function AdminDocumentsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Row['category']>('BUSINESS_LICENSE');
  const [fileUrl, setFileUrl] = useState('');
  const [notes, setNotes] = useState('');

  async function load() {
    const res = await fetch('/api/admin/documents', { cache: 'no-store' });
    const data = await safeJsonClient<any>(res);
    if (!res.ok) {
      setMessage(data?.message ?? 'Failed to load documents');
      return;
    }
    setRows(data?.data ?? []);
  }

  useEffect(() => {
    load().catch(() => null);
  }, []);

  async function createDoc(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    const res = await fetch('/api/admin/documents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, category, fileUrl, notes })
    });
    const data = await safeJsonClient<any>(res);
    if (!res.ok) {
      setMessage(data?.message ?? 'Failed to upload');
      return;
    }
    setTitle('');
    setFileUrl('');
    setNotes('');
    setMessage(data?.message ?? 'Uploaded');
    await load();
  }

  async function setActive(id: string, isActive: boolean) {
    const res = await fetch('/api/admin/documents', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, isActive })
    });
    const data = await safeJsonClient<any>(res);
    setMessage(data?.message ?? (res.ok ? 'Updated' : 'Failed to update'));
    await load();
  }

  return (
    <div className="space-y-6 text-white">
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-200">Document Center</p>
        <h1 className="mt-2 text-2xl font-semibold">Upload investor documents</h1>
        <p className="mt-2 text-sm text-slate-300">Business license, lease, tax files and supporting docs.</p>
      </div>

      <form onSubmit={createDoc} className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="grid gap-3 md:grid-cols-2">
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Document title" className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm" />
          <select value={category} onChange={e => setCategory(e.target.value as Row['category'])} className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm">
            {categories.map(c => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
          <input value={fileUrl} onChange={e => setFileUrl(e.target.value)} placeholder="File URL" className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm md:col-span-2" />
          <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes (optional)" className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm md:col-span-2" />
        </div>
        <button className="mt-4 rounded-full border border-white/10 bg-cyan-500/20 px-4 py-2 text-sm">Upload</button>
        {message ? <p className="mt-2 text-xs text-slate-300">{message}</p> : null}
      </form>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-lg font-semibold">Documents</h2>
        <div className="mt-3 space-y-2 text-sm text-slate-300">
          {rows.map(row => (
            <div key={row.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2">
              <div>
                <p className="font-medium text-white">{row.title}</p>
                <p className="text-xs text-slate-400">{row.category} · {new Date(row.created_at).toLocaleString()} · {row.UploadedBy?.email ?? '-'}</p>
                <a href={row.file_url} target="_blank" rel="noreferrer" className="text-xs text-cyan-200 underline">Open file</a>
              </div>
              <button
                onClick={() => setActive(row.id, !row.is_active)}
                className="rounded-full border border-white/10 px-3 py-1 text-xs"
              >
                {row.is_active ? 'Disable' : 'Enable'}
              </button>
            </div>
          ))}
          {rows.length === 0 ? <p>No documents uploaded yet.</p> : null}
        </div>
      </div>
    </div>
  );
}
