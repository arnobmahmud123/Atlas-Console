'use client';

import { useEffect, useState } from 'react';

export default function AdminCustomCssPage() {
  const [css, setCss] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/admin/custom-css')
      .then(res => res.json())
      .then(data => setCss(String(data.css ?? '')))
      .catch(() => setCss(''));
  }, []);

  async function onSave() {
    setSaved(false);
    await fetch('/api/admin/custom-css', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ css })
    });
    setSaved(true);
  }

  return (
    <div className="space-y-6 text-white">
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-200">Custom CSS</p>
        <h1 className="mt-2 text-2xl font-semibold">Add custom styles</h1>
        <p className="mt-2 text-sm text-slate-300">Apply custom CSS globally.</p>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        <textarea
          className="h-48 w-full rounded-xl border border-white/10 bg-black/40 p-4 text-sm text-white"
          placeholder="/* Enter custom CSS here */"
          value={css}
          onChange={e => setCss(e.target.value)}
        />
        <button onClick={onSave} className="mt-4 rounded-full border border-white/10 px-4 py-2 text-sm">
          Save
        </button>
        {saved && <p className="mt-2 text-xs text-cyan-200">Saved</p>}
      </div>
    </div>
  );
}
