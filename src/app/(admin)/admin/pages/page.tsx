'use client';

import { useEffect, useState } from 'react';

type PageItem = { slug: string; title: string; content: string };

export default function AdminPagesPage() {
  const [pages, setPages] = useState<PageItem[]>([]);
  const [form, setForm] = useState<PageItem>({ slug: '', title: '', content: '' });
  const [saved, setSaved] = useState(false);

  async function load() {
    const data = await fetch('/api/admin/cms/pages').then(res => res.json());
    setPages(data.value ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  async function onSave() {
    setSaved(false);
    await fetch('/api/admin/cms/pages', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    });
    setForm({ slug: '', title: '', content: '' });
    await load();
    setSaved(true);
  }

  return (
    <div className="space-y-6 text-white">
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-200">Pages</p>
        <h1 className="mt-2 text-2xl font-semibold">Content pages</h1>
        <p className="mt-2 text-sm text-slate-300">Manage static pages and create custom pages.</p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-3">
        <h2 className="text-lg font-semibold">Add / update page</h2>
        <input
          className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
          placeholder="Slug (e.g. about)"
          value={form.slug}
          onChange={e => setForm({ ...form, slug: e.target.value })}
        />
        <input
          className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
          placeholder="Title"
          value={form.title}
          onChange={e => setForm({ ...form, title: e.target.value })}
        />
        <textarea
          className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
          rows={6}
          placeholder="HTML content"
          value={form.content}
          onChange={e => setForm({ ...form, content: e.target.value })}
        />
        <button onClick={onSave} className="rounded-full border border-white/10 px-4 py-2 text-sm">Save page</button>
        {saved && <p className="text-xs text-cyan-200">Saved</p>}
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <h2 className="text-lg font-semibold">Existing pages</h2>
        <div className="mt-4 space-y-3 text-sm text-slate-300">
          {pages.map(page => (
            <div key={page.slug} className="flex items-center justify-between border-b border-white/5 pb-2">
              <span>{page.title}</span>
              <span className="text-xs text-slate-400">/{page.slug}</span>
            </div>
          ))}
          {pages.length === 0 && <p>No pages yet.</p>}
        </div>
      </div>
    </div>
  );
}
