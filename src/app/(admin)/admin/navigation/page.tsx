'use client';

import { useEffect, useState } from 'react';

type LinkItem = { label: string; href: string };

type NavigationSettings = {
  header: LinkItem[];
  footer: LinkItem[];
};

const defaults: NavigationSettings = {
  header: [
    { label: 'Features', href: '#features' },
    { label: 'Plans', href: '#plans' },
    { label: 'Security', href: '#security' }
  ],
  footer: [
    { label: 'FAQ', href: '#faq' },
    { label: 'Contact', href: '/contact' },
    { label: 'Legal', href: '/legal' }
  ]
};

export default function AdminNavigationPage() {
  const [settings, setSettings] = useState<NavigationSettings>(defaults);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/admin/navigation')
      .then(res => res.json())
      .then(data => setSettings(data.value ?? defaults));
  }, []);

  function updateList(type: 'header' | 'footer', value: string) {
    const list = value
      .split('\n')
      .map(line => line.split('|').map(part => part.trim()))
      .filter(parts => parts[0] && parts[1])
      .map(parts => ({ label: parts[0], href: parts[1] }));
    setSettings({ ...settings, [type]: list });
  }

  async function onSave() {
    setSaved(false);
    await fetch('/api/admin/navigation', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
    setSaved(true);
  }

  return (
    <div className="space-y-6 text-white">
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-200">Site Navigation</p>
        <h1 className="mt-2 text-2xl font-semibold">Menus</h1>
        <p className="mt-2 text-sm text-slate-300">Manage header and footer navigation links.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-lg font-semibold">Header menu</h2>
          <textarea
            className="mt-3 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
            rows={6}
            defaultValue={settings.header.map(item => `${item.label} | ${item.href}`).join('\n')}
            onChange={e => updateList('header', e.target.value)}
          />
          <p className="mt-2 text-xs text-slate-400">One per line: Label | /path</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-lg font-semibold">Footer menu</h2>
          <textarea
            className="mt-3 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
            rows={6}
            defaultValue={settings.footer.map(item => `${item.label} | ${item.href}`).join('\n')}
            onChange={e => updateList('footer', e.target.value)}
          />
          <p className="mt-2 text-xs text-slate-400">One per line: Label | /path</p>
        </div>
      </div>

      <button onClick={onSave} className="rounded-full border border-white/10 px-4 py-2 text-sm">
        Save navigation
      </button>
      {saved && <p className="text-xs text-cyan-200">Saved</p>}
    </div>
  );
}
