'use client';

import { useEffect, useState } from 'react';

type PageSettings = {
  breadcrumbImageUrl: string;
  maintenanceBanner: string;
  supportEmail: string;
};

const defaults: PageSettings = {
  breadcrumbImageUrl: '/images/breadcrumb.png',
  maintenanceBanner: 'Scheduled maintenance Sunday 02:00 UTC',
  supportEmail: 'support@saas.local'
};

export default function AdminPageSettings() {
  const [settings, setSettings] = useState<PageSettings>(defaults);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/admin/page-settings')
      .then(res => res.json())
      .then(data => setSettings(data.value ?? defaults));
  }, []);

  async function onSave() {
    setSaved(false);
    await fetch('/api/admin/page-settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
    setSaved(true);
  }

  return (
    <div className="space-y-6 text-white">
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-200">Page Settings</p>
        <h1 className="mt-2 text-2xl font-semibold">Brand assets & banners</h1>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-3">
        <input
          className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
          value={settings.breadcrumbImageUrl}
          onChange={e => setSettings({ ...settings, breadcrumbImageUrl: e.target.value })}
          placeholder="Breadcrumb image URL"
        />
        <input
          className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
          value={settings.maintenanceBanner}
          onChange={e => setSettings({ ...settings, maintenanceBanner: e.target.value })}
          placeholder="Maintenance banner"
        />
        <input
          className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white"
          value={settings.supportEmail}
          onChange={e => setSettings({ ...settings, supportEmail: e.target.value })}
          placeholder="Support email"
        />
        <button onClick={onSave} className="rounded-full border border-white/10 px-4 py-2 text-sm">
          Save settings
        </button>
        {saved && <p className="text-xs text-cyan-200">Saved</p>}
      </div>
    </div>
  );
}
