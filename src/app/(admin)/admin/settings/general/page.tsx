'use client';

import { useEffect, useState } from 'react';

type General = { siteName: string; supportEmail: string; maintenance: boolean };

export default function AdminGeneralSettingsPage() {
  const [settings, setSettings] = useState<General>({ siteName: 'SaaS App', supportEmail: 'support@saas.local', maintenance: false });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/admin/settings/general')
      .then(res => res.json())
      .then(data => setSettings(data.value ?? settings));
  }, []);

  async function onSave() {
    setSaved(false);
    await fetch('/api/admin/settings/general', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
    setSaved(true);
  }

  return (
    <div className="space-y-6 text-white">
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-200">System Settings</p>
        <h1 className="mt-2 text-2xl font-semibold">General settings</h1>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-3">
        <input className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm" value={settings.siteName} onChange={e => setSettings({ ...settings, siteName: e.target.value })} placeholder="Site name" />
        <input className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm" value={settings.supportEmail} onChange={e => setSettings({ ...settings, supportEmail: e.target.value })} placeholder="Support email" />
        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input type="checkbox" checked={settings.maintenance} onChange={e => setSettings({ ...settings, maintenance: e.target.checked })} />
          Maintenance mode
        </label>
        <button onClick={onSave} className="rounded-full border border-white/10 px-4 py-2 text-sm">Save</button>
        {saved && <p className="text-xs text-cyan-200">Saved</p>}
      </div>
    </div>
  );
}
