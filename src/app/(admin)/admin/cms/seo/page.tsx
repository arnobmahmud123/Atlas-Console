'use client';

import { useEffect, useState } from 'react';

type Seo = { title: string; description: string; keywords: string };

export default function AdminCmsSeoPage() {
  const [seo, setSeo] = useState<Seo>({ title: '', description: '', keywords: '' });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/admin/cms/seo')
      .then(res => res.json())
      .then(data => setSeo(data.value ?? seo));
  }, []);

  async function onSave() {
    setSaved(false);
    await fetch('/api/admin/cms/seo', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(seo)
    });
    setSaved(true);
  }

  return (
    <div className="space-y-6 text-white">
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-200">CMS</p>
        <h1 className="mt-2 text-2xl font-semibold">SEO settings</h1>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-3">
        <input className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm" value={seo.title} onChange={e => setSeo({ ...seo, title: e.target.value })} placeholder="Site title" />
        <textarea className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm" rows={3} value={seo.description} onChange={e => setSeo({ ...seo, description: e.target.value })} placeholder="Meta description" />
        <input className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm" value={seo.keywords} onChange={e => setSeo({ ...seo, keywords: e.target.value })} placeholder="Keywords (comma separated)" />
        <button onClick={onSave} className="rounded-full border border-white/10 px-4 py-2 text-sm">Save</button>
        {saved && <p className="text-xs text-cyan-200">Saved</p>}
      </div>
    </div>
  );
}
