'use client';

import { useEffect, useState } from 'react';

type Theme = { activeTheme: string; customCss: string };

export default function AdminCmsThemePage() {
  const [theme, setTheme] = useState<Theme>({ activeTheme: 'default', customCss: '' });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/admin/cms/theme')
      .then(res => res.json())
      .then(data => setTheme(data.value ?? theme));
  }, []);

  async function onSave() {
    setSaved(false);
    await fetch('/api/admin/cms/theme', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(theme)
    });
    setSaved(true);
  }

  return (
    <div className="space-y-6 text-white">
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-200">CMS</p>
        <h1 className="mt-2 text-2xl font-semibold">Theme settings</h1>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-3">
        <input className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm" value={theme.activeTheme} onChange={e => setTheme({ ...theme, activeTheme: e.target.value })} placeholder="Active theme" />
        <textarea className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm" rows={4} value={theme.customCss} onChange={e => setTheme({ ...theme, customCss: e.target.value })} placeholder="Custom CSS" />
        <button onClick={onSave} className="rounded-full border border-white/10 px-4 py-2 text-sm">Save</button>
        {saved && <p className="text-xs text-cyan-200">Saved</p>}
      </div>
    </div>
  );
}
