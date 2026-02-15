'use client';

import { useEffect, useState } from 'react';

type EmailSettings = { fromName: string; fromEmail: string };

export default function AdminEmailSettingsPage() {
  const [settings, setSettings] = useState<EmailSettings>({ fromName: 'Support', fromEmail: 'support@saas.local' });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/admin/notifications/email')
      .then(res => res.json())
      .then(data => setSettings(data.value ?? settings));
  }, []);

  async function onSave() {
    setSaved(false);
    await fetch('/api/admin/notifications/email', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings)
    });
    setSaved(true);
  }

  return (
    <div className="space-y-6 text-white">
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-200">Notification System</p>
        <h1 className="mt-2 text-2xl font-semibold">Email settings</h1>
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-3">
        <input className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm" value={settings.fromName} onChange={e => setSettings({ ...settings, fromName: e.target.value })} placeholder="From name" />
        <input className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm" value={settings.fromEmail} onChange={e => setSettings({ ...settings, fromEmail: e.target.value })} placeholder="From email" />
        <button onClick={onSave} className="rounded-full border border-white/10 px-4 py-2 text-sm">Save</button>
        {saved && <p className="text-xs text-cyan-200">Saved</p>}
      </div>
    </div>
  );
}
