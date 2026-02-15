'use client';

import { useEffect, useState } from 'react';

type LinkItem = { label: string; href: string };

type FooterSettings = {
  columns: { title: string; links: LinkItem[] }[];
  socials: LinkItem[];
};

const defaults: FooterSettings = {
  columns: [
    { title: 'Company', links: [{ label: 'About', href: '/about' }, { label: 'Careers', href: '/careers' }] },
    { title: 'Product', links: [{ label: 'Plans', href: '#plans' }, { label: 'Security', href: '#security' }] }
  ],
  socials: [{ label: 'X', href: 'https://x.com' }, { label: 'LinkedIn', href: 'https://linkedin.com' }]
};

export default function AdminFooterPage() {
  const [settings, setSettings] = useState<FooterSettings>(defaults);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/admin/footer')
      .then(res => res.json())
      .then(data => setSettings(data.value ?? defaults));
  }, []);

  function updateColumns(value: string) {
    const blocks = value.split('\n\n').map(block => block.trim()).filter(Boolean);
    const columns = blocks.map(block => {
      const [titleLine, ...links] = block.split('\n');
      return {
        title: titleLine.replace('Title:', '').trim() || 'Column',
        links: links
          .map(line => line.split('|').map(part => part.trim()))
          .filter(parts => parts[0] && parts[1])
          .map(parts => ({ label: parts[0], href: parts[1] }))
      };
    });
    setSettings({ ...settings, columns });
  }

  function updateSocials(value: string) {
    const socials = value
      .split('\n')
      .map(line => line.split('|').map(part => part.trim()))
      .filter(parts => parts[0] && parts[1])
      .map(parts => ({ label: parts[0], href: parts[1] }));
    setSettings({ ...settings, socials });
  }

  async function onSave() {
    setSaved(false);
    await fetch('/api/admin/footer', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
    setSaved(true);
  }

  const columnsValue = settings.columns
    .map(col => [`Title: ${col.title}`, ...col.links.map(link => `${link.label} | ${link.href}`)].join('\n'))
    .join('\n\n');

  return (
    <div className="space-y-6 text-white">
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-200">Footer</p>
        <h1 className="mt-2 text-2xl font-semibold">Footer contents</h1>
        <p className="mt-2 text-sm text-slate-300">Manage footer columns and socials.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-lg font-semibold">Columns</h2>
          <textarea
            className="mt-3 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
            rows={10}
            defaultValue={columnsValue}
            onChange={e => updateColumns(e.target.value)}
          />
          <p className="mt-2 text-xs text-slate-400">Separate columns with a blank line.</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-lg font-semibold">Social links</h2>
          <textarea
            className="mt-3 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
            rows={10}
            defaultValue={settings.socials.map(item => `${item.label} | ${item.href}`).join('\n')}
            onChange={e => updateSocials(e.target.value)}
          />
          <p className="mt-2 text-xs text-slate-400">One per line: Label | URL</p>
        </div>
      </div>

      <button onClick={onSave} className="rounded-full border border-white/10 px-4 py-2 text-sm">
        Save footer
      </button>
      {saved && <p className="text-xs text-cyan-200">Saved</p>}
    </div>
  );
}
