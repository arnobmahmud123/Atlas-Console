'use client';

import { useEffect, useState } from 'react';

export default function AdminThemesPage() {
  const [activeTheme, setActiveTheme] = useState('default');
  const [customHtml, setCustomHtml] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/admin/themes')
      .then(res => res.json())
      .then(data => {
        setActiveTheme(String(data.activeTheme ?? 'default'));
        setCustomHtml(String(data.customHtml ?? ''));
      })
      .catch(() => null);
  }, []);

  async function onSave() {
    setSaved(false);
    await fetch('/api/admin/themes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activeTheme, customHtml })
    });
    setSaved(true);
  }

  return (
    <div className="space-y-6 text-white">
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-200">Theme Management</p>
        <h1 className="mt-2 text-2xl font-semibold">Themes</h1>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
        <div className="space-y-2">
          <label className="text-sm text-slate-300">Active theme</label>
          <input
            className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
            value={activeTheme}
            onChange={e => setActiveTheme(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm text-slate-300">Custom HTML</label>
          <textarea
            className="h-32 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
            value={customHtml}
            onChange={e => setCustomHtml(e.target.value)}
          />
        </div>
        <button onClick={onSave} className="rounded-full border border-white/10 px-4 py-2 text-sm">
          Save theme
        </button>
        {saved && <p className="text-xs text-cyan-200">Saved</p>}
      </div>
    </div>
  );
}
