'use client';

import { useEffect, useState } from 'react';

type CmsPage = { slug: string; title: string; content: string };

export default function AdminCmsPagesPage() {
  const [pages, setPages] = useState<CmsPage[]>([]);
  const [slug, setSlug] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/admin/cms/pages')
      .then(res => res.json())
      .then(data => setPages(data.value ?? []));
  }, []);

  async function onSave() {
    setSaved(false);
    await fetch('/api/admin/cms/pages', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug, title, content })
    });
    const updated = await fetch('/api/admin/cms/pages').then(res => res.json());
    setPages(updated.value ?? []);
    setSaved(true);
  }

  function editPage(page: CmsPage) {
    setSlug(page.slug);
    setTitle(page.title);
    setContent(page.content);
  }

  return (
    <div className="space-y-6 text-white">
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-200">CMS</p>
        <h1 className="mt-2 text-2xl font-semibold">Pages</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-3">
          <input className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm" value={slug} onChange={e => setSlug(e.target.value)} placeholder="slug (e.g. about)" />
          <input className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm" value={title} onChange={e => setTitle(e.target.value)} placeholder="Title" />
          <textarea className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm" rows={6} value={content} onChange={e => setContent(e.target.value)} placeholder="HTML content" />
          <button onClick={onSave} className="rounded-full border border-white/10 px-4 py-2 text-sm">Save page</button>
          {saved && <p className="text-xs text-cyan-200">Saved</p>}
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-lg font-semibold">Existing pages</h2>
          <div className="mt-4 space-y-3 text-sm text-slate-300">
            {pages.map(page => (
              <button key={page.slug} onClick={() => editPage(page)} className="w-full text-left border-b border-white/5 pb-2">
                <p className="text-white">/{page.slug}</p>
                <p className="text-xs text-slate-400">{page.title}</p>
              </button>
            ))}
            {pages.length === 0 && <p>No pages yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
