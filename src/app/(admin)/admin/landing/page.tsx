'use client';

import { useEffect, useState } from 'react';

type LandingSettings = {
  heroTitle: string;
  heroSubtitle: string;
  ctaPrimary: string;
  ctaSecondary: string;
  sections: string[];
};

const defaultValue: LandingSettings = {
  heroTitle: 'Digital wealth operations, rebuilt for scale.',
  heroSubtitle: 'A ledger-first platform with automated rewards and compliance.',
  ctaPrimary: 'Start Investing',
  ctaSecondary: 'View Live Demo',
  sections: ['Hero', 'Features', 'Plans', 'Security', 'FAQ', 'Newsletter']
};

export default function AdminLandingPage() {
  const [settings, setSettings] = useState<LandingSettings>(defaultValue);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/admin/landing')
      .then(res => res.json())
      .then(data => setSettings(data.value ?? defaultValue));
  }, []);

  async function onSave() {
    setSaved(false);
    await fetch('/api/admin/landing', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
    setSaved(true);
  }

  return (
    <div className="space-y-6 text-white">
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-200">Landing Page</p>
        <h1 className="mt-2 text-2xl font-semibold">Homepage sections</h1>
        <p className="mt-2 text-sm text-slate-300">Manage hero copy and homepage sections.</p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-3">
        <input
          className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
          value={settings.heroTitle}
          onChange={e => setSettings({ ...settings, heroTitle: e.target.value })}
          placeholder="Hero title"
        />
        <textarea
          className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
          rows={3}
          value={settings.heroSubtitle}
          onChange={e => setSettings({ ...settings, heroSubtitle: e.target.value })}
          placeholder="Hero subtitle"
        />
        <div className="grid gap-3 md:grid-cols-2">
          <input
            className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
            value={settings.ctaPrimary}
            onChange={e => setSettings({ ...settings, ctaPrimary: e.target.value })}
            placeholder="Primary CTA"
          />
          <input
            className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
            value={settings.ctaSecondary}
            onChange={e => setSettings({ ...settings, ctaSecondary: e.target.value })}
            placeholder="Secondary CTA"
          />
        </div>
        <textarea
          className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
          rows={4}
          value={settings.sections.join('\n')}
          onChange={e => setSettings({ ...settings, sections: e.target.value.split('\n').filter(Boolean) })}
          placeholder="One section per line"
        />
        <button onClick={onSave} className="rounded-full border border-white/10 px-4 py-2 text-sm">
          Save
        </button>
        {saved && <p className="text-xs text-cyan-200">Saved</p>}
      </div>
    </div>
  );
}
